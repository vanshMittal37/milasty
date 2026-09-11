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

    // 3. Hash password for secure database storage
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newUser = null;

    // 4. Case A: User already exists in public.users (e.g. from orders/legacy records)
    if (existingDbUser) {
      const targetId = existingDbUser.id;

      // Sync/Create Supabase Auth session if not already existing
      if (!existingAuthUser) {
        try {
          await supabase.auth.admin.createUser({
            email: cleanEmail,
            password: password,
            email_confirm: true,
            user_metadata: { name: name.trim(), phone: phone ? phone.trim() : '', role },
          });
        } catch (authErr) {
          console.warn('Supabase Auth sync error for existing DB user:', authErr.message);
        }
      } else {
        try {
          await supabase.auth.admin.updateUserById(existingAuthUser.id, { password: password });
        } catch (uErr) {
          console.warn('Update Auth user password error:', uErr.message);
        }
      }

      // Update existing record WITHOUT mutating the 'id' column to prevent foreign key errors
      const { data: updatedDbUser, error: updateErr } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          password_hash: passwordHash,
          phone: phone ? phone.trim() : '',
          role,
          updated_at: new Date(),
        })
        .eq('id', targetId)
        .select('id, name, email, phone, role, addresses')
        .single();

      if (updateErr) {
        console.error('Supabase DB update error:', updateErr);
        return res.status(500).json({ message: `Database error updating profile: ${updateErr.message}` });
      }

      newUser = updatedDbUser;
    } else {
      // 5. Case B: Truly NEW user
      let newAuthId = null;

      if (!existingAuthUser) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: password,
          email_confirm: true,
          user_metadata: { name: name.trim(), phone: phone ? phone.trim() : '', role },
        });

        if (authData?.user?.id) {
          newAuthId = authData.user.id;
        } else if (authError) {
          console.error('Supabase Auth createUser error:', authError);
          const isDuplicate = authError.message?.toLowerCase().includes('already registered') || 
                              authError.message?.toLowerCase().includes('already exists') || 
                              authError.message?.toLowerCase().includes('user_already_exists');
          
          if (isDuplicate) {
            return res.status(400).json({ message: 'This email address is already registered. Please log in instead.' });
          }
          return res.status(400).json({ message: `Authentication error: ${authError.message}` });
        }
      } else {
        newAuthId = existingAuthUser.id;
        try {
          await supabase.auth.admin.updateUserById(newAuthId, { password: password });
        } catch (uErr) {
          console.warn('Update Auth password error:', uErr.message);
        }
      }

      if (!newAuthId) {
        newAuthId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      }

      // Insert new record into public.users
      const { data: createdDbUser, error: insertErr } = await supabase
        .from('users')
        .insert([
          {
            id: newAuthId,
            name: name.trim(),
            email: cleanEmail,
            password_hash: passwordHash,
            phone: phone ? phone.trim() : '',
            role,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        .select('id, name, email, phone, role, addresses')
        .single();

      if (insertErr) {
        console.error('Supabase PostgreSQL insert error:', insertErr);
        return res.status(500).json({ message: `Database error creating user: ${insertErr.message}` });
      }

      newUser = createdDbUser;
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
    if (!user.password_hash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Keep Supabase Auth password synchronized in background
    try {
      await supabase.auth.admin.updateUserById(user.id, { password });
    } catch (sErr) {}

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

// Change Password (for logged-in customer in Account Settings)
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please enter current password and new password' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
      });
    }

    const { data: user } = await supabase.from('users').select('id, email, password_hash').eq('id', userId).single();
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Verify current password
    let isCurrentValid = false;
    if (user.password_hash) {
      isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
    }
    if (!isCurrentValid) {
      try {
        const { data: authData } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
        if (authData?.user) isCurrentValid = true;
      } catch (e) {}
    }

    if (!isCurrentValid) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    // Update password in Supabase Auth
    try {
      await supabase.auth.admin.updateUserById(userId, { password: newPassword });
    } catch (aErr) {
      console.warn('Supabase Auth update warning:', aErr.message);
    }

    // Update bcrypt password_hash in PostgreSQL users table
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await supabase.from('users').update({ password_hash: passwordHash, updated_at: new Date() }).eq('id', userId);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

// Forgot Password — Resend API + JWT reset token (no Supabase admin API, no nodemailer)
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

    const frontendUrl = (process.env.FRONTEND_URL || 'https://milasty.vercel.app').replace(/\/$/, '');
    console.log(`[FORGOT PASSWORD] Request for: ${cleanEmail}`);

    // 1. Look up user name for personalized greeting
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', cleanEmail)
      .maybeSingle();

    // 2. Generate a secure JWT reset token (1 hour expiry)
    const resetToken = jwt.sign(
      { email: cleanEmail, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;
    console.log(`[FORGOT PASSWORD] Reset link generated for: ${cleanEmail}`);

    // 3. Email HTML
    const emailHtml = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;padding:32px 24px;background-color:#FAF7F2;color:#24130D;max-width:520px;margin:0 auto;border-radius:18px;border:1px solid #E8DCCB;">
        <div style="text-align:center;margin-bottom:20px;">
          <span style="font-size:1.6rem;font-weight:800;letter-spacing:0.08em;color:#24130D;">MILASTY</span>
        </div>
        <h2 style="color:#244f21;font-size:1.3rem;margin-bottom:12px;">Password Reset Request</h2>
        <p style="margin:0 0 12px;line-height:1.6;">Hello${dbUser?.name ? ` ${dbUser.name}` : ''},</p>
        <p style="margin:0 0 20px;line-height:1.6;">We received a request to reset the password for your MILASTY account associated with <strong>${cleanEmail}</strong>.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${resetLink}" style="background-color:#244f21;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:12px;font-weight:700;font-size:1rem;display:inline-block;">
            Reset My Password
          </a>
        </div>
        <p style="font-size:0.82rem;color:#7A5535;line-height:1.5;margin:0 0 8px;">This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email — your account is safe.</p>
        <hr style="border:none;border-top:1px solid #E8DCCB;margin:20px 0;" />
        <p style="font-size:0.75rem;color:#A08060;text-align:center;margin:0;">© ${new Date().getFullYear()} MILASTY. All rights reserved.</p>
      </div>
    `;

    // 4. Send via Resend API
    if (!process.env.RESEND_API_KEY) {
      console.error('[FORGOT PASSWORD] ❌ RESEND_API_KEY not set in environment!');
      return res.json({ message: "If an account exists for this email, you'll receive a password reset link shortly." });
    }

    try {
      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'MILASTY <onboarding@resend.dev>',
          to: [cleanEmail],
          subject: 'Reset your MILASTY Account Password',
          html: emailHtml,
        }),
      });

      const resendData = await resendResp.json();
      console.log(`[RESEND API] Status: ${resendResp.status}`, JSON.stringify(resendData));

      if (resendResp.status === 200 || resendResp.status === 201) {
        console.log(`[FORGOT PASSWORD] ✅ Email sent via Resend to: ${cleanEmail}`);
      } else {
        console.warn(`[FORGOT PASSWORD] ⚠️ Resend returned ${resendResp.status}:`, resendData);
        // If Resend fails (e.g. 403 for non-account email with sandbox domain),
        // the user needs to add a custom domain at https://resend.com/domains
      }
    } catch (rErr) {
      console.error('[FORGOT PASSWORD] ❌ Resend fetch error:', rErr.message);
    }

    // Always respond with success (security: don't reveal if email exists)
    res.json({ message: "If an account exists for this email, you'll receive a password reset link shortly. Please check your Inbox and Spam folder." });
  } catch (error) {
    console.error('[FORGOT PASSWORD] Unhandled error:', error);
    res.status(500).json({ message: 'Error processing password reset request', error: error.message });
  }
};



// Reset Password — supports both JWT reset tokens and Supabase access tokens
export const resetPassword = async (req, res) => {
  try {
    const { email, password, access_token, token } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Please enter a new password' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
      });
    }

    let cleanEmail = email ? email.toLowerCase().trim() : null;
    let targetUserId = null;

    // 1. Verify our JWT reset token (from Gmail/Resend email link)
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.purpose !== 'password_reset') {
          return res.status(400).json({ message: 'Invalid reset token. Please request a new link.' });
        }
        cleanEmail = decoded.email;
        console.log(`[RESET PASSWORD] JWT token verified for: ${cleanEmail}`);
      } catch (jwtErr) {
        if (jwtErr.name === 'TokenExpiredError') {
          return res.status(400).json({ message: 'This reset link has expired. Please request a new one.' });
        }
        return res.status(400).json({ message: 'Invalid reset token. Please request a new link.' });
      }
    }

    // 2. Fallback: Supabase access_token (from Supabase email flow)
    if (!cleanEmail && access_token) {
      try {
        const { data: userData } = await supabase.auth.getUser(access_token);
        if (userData?.user?.email) {
          cleanEmail = userData.user.email;
          targetUserId = userData.user.id;
        }
      } catch (e) {}
    }

    if (!cleanEmail) {
      return res.status(400).json({ message: 'Unable to identify user. Please request a new password reset link.' });
    }

    console.log(`[RESET PASSWORD] Updating password for: ${cleanEmail}`);

    // 3. Find user in PostgreSQL
    if (!targetUserId) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (dbUser) targetUserId = dbUser.id;
    }

    // 4. Update bcrypt hash in PostgreSQL users table
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date() })
      .eq('email', cleanEmail);

    if (updateErr) {
      console.error('[RESET PASSWORD] DB update error:', updateErr.message);
    }

    // 5. Also update Supabase Auth (best effort)
    if (targetUserId) {
      try {
        await supabase.auth.admin.updateUserById(targetUserId, { password });
      } catch (authErr) {
        console.warn('[RESET PASSWORD] Supabase Auth update warning:', authErr.message);
      }
    }

    console.log(`[RESET PASSWORD] ✅ Password updated for: ${cleanEmail}`);
    res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('[RESET PASSWORD] Unhandled error:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};


