import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'milasty_super_secret_jwt_key_2026';

// Register User with Supabase Auth & PostgreSQL users table
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Input Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Please enter your full name' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please enter your email address' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Please enter a password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const role = cleanEmail === 'admin@milasty.com' ? 'admin' : 'customer';

    // 2. Check if user exists in Supabase PostgreSQL 'users' table AND Supabase Auth
    const { data: existingDbUser, error: dbCheckErr } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (dbCheckErr) {
      console.error('Supabase DB check error:', dbCheckErr);
    }

    // Check Supabase Auth engine for existing user
    let existingAuthUser = null;
    try {
      const { data: usersList } = await supabase.auth.admin.listUsers();
      existingAuthUser = usersList?.users?.find((u) => u.email === cleanEmail);
    } catch (aCheckErr) {
      console.warn('Supabase Auth listUsers warning:', aCheckErr.message);
    }

    // If registered in BOTH DB and Supabase Auth, return duplicate email error
    if (existingDbUser && existingAuthUser) {
      return res.status(400).json({ message: 'This email address is already registered. Please log in instead.' });
    }

    // 3. Hash password for secure database storage
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create or synchronize user in Supabase Auth
    let userId = existingDbUser?.id || existingAuthUser?.id || null;

    if (!existingAuthUser) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: { name: name.trim(), phone: phone ? phone.trim() : '', role },
      });

      if (authData?.user?.id) {
        userId = authData.user.id;
      } else if (authError) {
        console.error('Supabase Auth createUser error:', authError);
        // If Auth fails because email exists in Auth engine
        if (authError.message?.toLowerCase().includes('already') || authError.status === 422) {
          return res.status(400).json({ message: 'This email address is already registered. Please log in instead.' });
        }
        return res.status(500).json({
          message: `Authentication engine error: ${authError.message || 'Failed to create user session'}`,
        });
      }
    } else {
      // User existed in Supabase Auth but not DB - update Auth password
      userId = existingAuthUser.id;
      try {
        await supabase.auth.admin.updateUserById(userId, { password: password });
      } catch (uErr) {
        console.warn('Update existing Auth user password warning:', uErr.message);
      }
    }

    if (!userId) {
      userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    // 5. Upsert user record in Supabase PostgreSQL 'users' table
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .upsert([
        {
          id: userId,
          name: name.trim(),
          email: cleanEmail,
          password_hash: passwordHash,
          phone: phone ? phone.trim() : '',
          role,
          updated_at: new Date(),
        },
      ], { onConflict: 'email' })
      .select('id, name, email, phone, role, addresses')
      .single();

    if (dbError) {
      console.error('Supabase PostgreSQL upsert error:', dbError);
      return res.status(500).json({
        message: `Database error during registration: ${dbError.message || 'Failed to save profile'}`,
      });
    }

    // Issue JWT session token
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      _id: newUser.id,
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      addresses: newUser.addresses || [],
      token,
    });
  } catch (error) {
    console.error('Registration server error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};


// Login User & Admin with Supabase Auth
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch user record from Supabase PostgreSQL 'users' table
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (dbError || !user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. Verify password with stored bcrypt hash
    if (user.password_hash) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      // Fallback to Supabase Auth signin if no password_hash in DB
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (authError) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    // 3. Keep Supabase Auth password synchronized in background
    try {
      await supabase.auth.admin.updateUserById(user.id, { password: password });
    } catch (sErr) {
      // Ignore background sync errors if Auth Admin API restricted
    }

    // Issue JWT session token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses || [],
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Get current user profile session
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, addresses')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Add User Address
export const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const newAddress = req.body;

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('addresses')
      .eq('id', userId)
      .single();

    if (fetchErr || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentAddresses = user.addresses || [];
    const addressId = Date.now().toString();
    const updatedAddresses = [...currentAddresses, { ...newAddress, _id: addressId, id: addressId }];

    const { error: updateErr } = await supabase
      .from('users')
      .update({ addresses: updatedAddresses, updated_at: new Date() })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    res.status(201).json(updatedAddresses);
  } catch (error) {
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
};

// Update User Address
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const addressData = req.body;

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('addresses')
      .eq('id', userId)
      .single();

    if (fetchErr || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentAddresses = user.addresses || [];
    const updatedAddresses = currentAddresses.map((addr) => {
      if (addr._id === addressId || addr.id === addressId) {
        return { ...addr, ...addressData };
      }
      return addr;
    });

    const { error: updateErr } = await supabase
      .from('users')
      .update({ addresses: updatedAddresses, updated_at: new Date() })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    res.json(updatedAddresses);
  } catch (error) {
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
};

// Delete User Address
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('addresses')
      .eq('id', userId)
      .single();

    if (fetchErr || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentAddresses = user.addresses || [];
    const updatedAddresses = currentAddresses.filter((addr) => addr._id !== addressId && addr.id !== addressId);

    const { error: updateErr } = await supabase
      .from('users')
      .update({ addresses: updatedAddresses, updated_at: new Date() })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    res.json(updatedAddresses);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
};

// Update User Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    const updates = { updated_at: new Date() };
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, name, email, phone, role, addresses')
      .single();

    if (error) throw error;

    res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please enter your email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

    // Request password reset email from Supabase Auth
    try {
      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${frontendUrl}/reset-password`,
      });
    } catch (sErr) {
      console.error('Supabase resetPasswordForEmail warning:', sErr.message);
    }

    // Security: Generic message to prevent account enumeration
    res.json({
      message: "If an account exists for this email, you'll receive a password reset link shortly.",
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset request', error: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, password, token, access_token } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Please enter a new password' });
    }

    // Validate password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
      });
    }

    let targetUserId = null;
    let cleanEmail = email ? email.toLowerCase().trim() : null;

    // 1. If email is provided, lookup user in Supabase PostgreSQL 'users' table
    if (cleanEmail) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbUser) {
        targetUserId = dbUser.id;
      }
    }

    // 2. If targetUserId still unknown, try listing/retrieving user from Supabase Auth
    if (!targetUserId && access_token) {
      const { data: userData } = await supabase.auth.getUser(access_token);
      if (userData?.user?.id) {
        targetUserId = userData.user.id;
        cleanEmail = userData.user.email;
      }
    }

    // 3. Fallback: Search Supabase Auth by email if email provided
    if (!targetUserId && cleanEmail) {
      const { data: usersList } = await supabase.auth.admin.listUsers();
      const authUser = usersList?.users?.find((u) => u.email === cleanEmail);
      if (authUser) {
        targetUserId = authUser.id;
      }
    }

    if (!targetUserId && !cleanEmail) {
      return res.status(400).json({ message: 'Unable to identify user for password reset. Please request a new link.' });
    }

    // 4. Update password in Supabase Auth
    if (targetUserId) {
      try {
        await supabase.auth.admin.updateUserById(targetUserId, { password });
      } catch (authErr) {
        console.warn('Supabase Auth admin updateUserById warning:', authErr.message);
      }
    }

    // 5. Update bcrypt password_hash in Supabase PostgreSQL 'users' table
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (targetUserId) {
      await supabase
        .from('users')
        .update({ password_hash: passwordHash, updated_at: new Date() })
        .eq('id', targetUserId);
    } else if (cleanEmail) {
      await supabase
        .from('users')
        .update({ password_hash: passwordHash, updated_at: new Date() })
        .eq('email', cleanEmail);
    }

    res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

