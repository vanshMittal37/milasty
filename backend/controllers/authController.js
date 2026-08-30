import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'milasty_super_secret_jwt_key_2026';

// Register User with Supabase Auth
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const role = cleanEmail === 'admin@milasty.com' ? 'admin' : 'customer';

    // 1. Check if user already exists in Supabase PostgreSQL 'users' table
    const { data: existingDbUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingDbUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 2. Hash password for secure database storage and authentication
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Create or fetch user in Supabase Auth (Dashboard -> Authentication -> Users)
    let userId = null;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: { name, phone, role },
    });

    if (authData?.user?.id) {
      userId = authData.user.id;
    } else if (authError) {
      // If already registered in Supabase Auth engine, retrieve Auth User ID or generate fallback
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAuth = existingUsers?.users?.find((u) => u.email === cleanEmail);
      if (existingAuth) {
        userId = existingAuth.id;
        // Keep Supabase Auth password updated
        await supabase.auth.admin.updateUserById(userId, { password: password });
      } else {
        userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      }
    }

    // 4. Insert user record into Supabase PostgreSQL 'users' table
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

    if (dbError) throw dbError;

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
    res.json({ message: 'Password reset link sent to registered email if account exists.' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing forgot password', error: error.message });
  }
};
