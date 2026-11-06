import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { normalizeIndianMobile, isEmailAddress } from '../utils/phone.js';
import { generateAndSendWhatsAppOtp, verifyWhatsAppOtp } from '../services/otpService.js';
import { triggerEventAsync } from '../services/whatsappEventService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'milasty_super_secret_jwt_key_2026';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  whatsapp: true,
  whatsapp_promotional: false,
};

// Compared against when no account matches, so a wrong identifier takes as long as a wrong password
const DUMMY_HASH = bcrypt.hashSync('milasty-no-such-account', 10);

// Brute-force guard for login: per IP + identifier, in memory (resets on restart)
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;
const loginFailures = new Map();

function loginBlocked(key) {
  const entry = loginFailures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > LOGIN_WINDOW_MS) {
    loginFailures.delete(key);
    return false;
  }
  return entry.count >= LOGIN_MAX_FAILURES;
}

function recordLoginFailure(key) {
  const entry = loginFailures.get(key);
  if (!entry || Date.now() - entry.first > LOGIN_WINDOW_MS) loginFailures.set(key, { count: 1, first: Date.now() });
  else entry.count += 1;
}

/**
 * Accounts whose stored phone is this mobile number. Stored formats vary (+91…, 0…, plain), so match
 * on the trailing 10 digits and confirm with the normalizer.
 */
async function findUsersByMobile(mobile, columns = 'id, phone') {
  const { data, error } = await supabase.from('users').select(columns).like('phone', `%${mobile}`);
  if (error) throw error;
  return (data || []).filter((u) => normalizeIndianMobile(u.phone) === mobile);
}

// Binds a reset link to the password it replaces, so the link stops working once it has been used
const passwordVersion = (passwordHash) =>
  crypto.createHash('sha256').update(String(passwordHash || '')).digest('hex').slice(0, 16);

// Register User with Supabase Auth & PostgreSQL users table
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone: rawPhone } = req.body;

    // 1. Input Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Please enter your full name' });
    }

    // Mobile number is mandatory: 10-digit Indian mobile, optional +91 / 0 prefix, spaces/dashes allowed
    const phone = normalizeIndianMobile(rawPhone);
    if (!phone) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }
    const rawEmail = String(email || '').trim();
    let cleanEmail = '';
    let existingDbUser = null;

    if (rawEmail) {
      cleanEmail = rawEmail.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }

      // Check if user exists in Supabase PostgreSQL 'users' table
      const { data: dbUser, error: dbCheckErr } = await supabase
        .from('users')
        .select('id, email, password_hash')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbCheckErr) {
        console.error('Supabase DB check error:', dbCheckErr);
      }

      if (dbUser?.password_hash) {
        return res.status(400).json({ message: 'This email address is already registered. Please log in instead.' });
      }
      existingDbUser = dbUser;
    } else {
      // If email is not provided, use an internal unique mobile-based email to satisfy database NOT NULL/UNIQUE constraints
      cleanEmail = `${phone}@customer.milasty.com`;
    }

    if (!password) {
      return res.status(400).json({ message: 'Please enter a password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const role = cleanEmail === 'admin@milasty.com' ? 'admin' : 'customer';

    // Mobile login identifies the account by its number, so a number may belong to only one account
    const phoneOwners = await findUsersByMobile(phone);
    if (phoneOwners.length > 0 && (!existingDbUser || phoneOwners.some((u) => u.id !== existingDbUser.id))) {
      return res.status(400).json({ message: 'This mobile number is already registered. Please log in instead.' });
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

    const displayEmail = (newUser.email && newUser.email.endsWith('@customer.milasty.com')) ? '' : newUser.email;

    // Asynchronously dispatch WhatsApp registration notifications (Customer Welcome + Admin Alert)
    triggerEventAsync('CUSTOMER_REGISTERED', {
      user: newUser,
      name: newUser.name,
      phone: newUser.phone,
      email: displayEmail,
    });

    res.status(201).json({
      _id: newUser.id,
      id: newUser.id,
      name: newUser.name,
      email: displayEmail,
      phone: newUser.phone,
      role: newUser.role,
      addresses: newUser.addresses || [],
      notification_preferences: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(newUser.notification_preferences || {}),
      },
      token,
    });
  } catch (error) {
    console.error('Registration server error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

/**
 * 1. SEND SIGNUP WHATSAPP OTP
 * POST /api/auth/signup/send-otp
 */
export const sendSignupOtp = async (req, res) => {
  try {
    const { name, email, password, phone: rawPhone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Please enter your full name' });
    }

    const phone = normalizeIndianMobile(rawPhone);
    if (!phone) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    let existingDbUser = null;
    const rawEmail = String(email || '').trim();
    if (rawEmail) {
      const cleanEmail = rawEmail.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }

      // Check if email is already registered with a password
      const { data } = await supabase
        .from('users')
        .select('id, email, password_hash')
        .eq('email', cleanEmail)
        .maybeSingle();
      existingDbUser = data;

      if (existingDbUser?.password_hash) {
        return res.status(400).json({ message: 'This email address is already registered. Please log in instead.' });
      }
    }

    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if phone is already registered
    const phoneOwners = await findUsersByMobile(phone);
    if (phoneOwners.some((u) => u.id !== existingDbUser?.id)) {
      return res.status(400).json({ message: 'This mobile number is already registered. Please log in instead.' });
    }

    // Generate and dispatch WhatsApp OTP
    const otpResult = await generateAndSendWhatsAppOtp({
      phone,
      purpose: 'signup',
      ip: req.ip,
    });

    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.error, resendCooldown: otpResult.resendCooldown });
    }

    return res.json({
      success: true,
      message: 'Verification code sent to your WhatsApp number.',
      resendCooldown: otpResult.resendCooldown || 60,
    });
  } catch (error) {
    console.error('[SIGNUP OTP] Error generating OTP:', error);
    res.status(500).json({ message: 'Error sending verification code', error: error.message });
  }
};

/**
 * 2. VERIFY SIGNUP WHATSAPP OTP & COMPLETE REGISTRATION
 * POST /api/auth/signup/verify-otp
 */
export const verifySignupOtp = async (req, res) => {
  try {
    const { name, email, password, phone: rawPhone, otp } = req.body;

    const phone = normalizeIndianMobile(rawPhone);
    if (!phone) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
      return res.status(400).json({ message: 'Please enter the 6-digit verification code' });
    }

    // 1. Verify submitted OTP
    const verifyResult = await verifyWhatsAppOtp({
      phone,
      purpose: 'signup',
      otp,
    });

    if (!verifyResult.success) {
      return res.status(400).json({
        message: verifyResult.error,
        remainingAttempts: verifyResult.remainingAttempts,
      });
    }

    // 2. Proceed with account registration using existing Supabase Auth architecture
    return await registerUser(req, res);
  } catch (error) {
    console.error('[SIGNUP OTP] Error verifying OTP and registering:', error);
    res.status(500).json({ message: 'Error verifying code', error: error.message });
  }
};


// Login User & Admin: email + password or mobile number + password.
// The identifier only finds the account; the bcrypt password check is what authenticates.
export const loginUser = async (req, res) => {
  try {
    // `email` is still accepted from older clients
    const identifier = String(req.body.identifier ?? req.body.email ?? '').trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please enter your email address or mobile number and your password' });
    }

    const byEmail = identifier.includes('@');
    const mobile = byEmail ? null : normalizeIndianMobile(identifier);
    if (byEmail ? !isEmailAddress(identifier) : !mobile) {
      return res.status(400).json({ message: 'Please enter a valid email address or 10-digit mobile number' });
    }

    const invalidMessage = byEmail ? 'Invalid email or password' : 'Invalid mobile number or password';
    const throttleKey = `${req.ip}|${byEmail ? identifier.toLowerCase() : mobile}`;
    if (loginBlocked(throttleKey)) {
      return res.status(429).json({ message: 'Too many unsuccessful sign-in attempts. Please wait 15 minutes and try again, or reset your password.' });
    }

    // 1. Find the candidate account(s)
    let candidates = [];
    if (byEmail) {
      const { data, error } = await supabase.from('users').select('*').eq('email', identifier.toLowerCase()).maybeSingle();
      if (error) throw error;
      if (data) candidates = [data];
    } else {
      candidates = await findUsersByMobile(mobile, '*');
    }

    // 2. Verify the password. A number shared by older accounts logs into the one whose password
    //    matches; if several match we can't tell which account is meant, so ask for the email.
    const withPassword = candidates.filter((u) => u.password_hash);
    const matched = [];
    for (const u of withPassword) {
      if (await bcrypt.compare(password, u.password_hash)) matched.push(u);
    }
    if (withPassword.length === 0) await bcrypt.compare(password, DUMMY_HASH);

    if (matched.length === 0) {
      recordLoginFailure(throttleKey);
      return res.status(401).json({ message: invalidMessage });
    }
    if (matched.length > 1) {
      return res.status(409).json({ message: 'More than one account uses this mobile number. Please sign in with your email address.' });
    }

    const user = matched[0];
    loginFailures.delete(throttleKey);

    // 3. Keep Supabase Auth password synchronized in background
    try {
      await supabase.auth.admin.updateUserById(user.id, { password });
    } catch (sErr) {}

    // Issue JWT session token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    const displayEmail = (user.email && user.email.endsWith('@customer.milasty.com')) ? '' : user.email;

    res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: displayEmail,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses || [],
      notification_preferences: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(user.notification_preferences || {}),
      },
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
    let user = null;
    const { data: userWithPrefs, error: errWithPrefs } = await supabase
      .from('users')
      .select('id, name, email, phone, role, addresses, notification_preferences')
      .eq('id', userId)
      .maybeSingle();

    if (errWithPrefs && errWithPrefs.code === '42703') {
      const { data: basicUser, error: basicErr } = await supabase
        .from('users')
        .select('id, name, email, phone, role, addresses')
        .eq('id', userId)
        .maybeSingle();
      if (basicErr || !basicUser) return res.status(404).json({ message: 'User not found' });
      user = basicUser;
    } else if (errWithPrefs || !userWithPrefs) {
      return res.status(404).json({ message: 'User not found' });
    } else {
      user = userWithPrefs;
    }

    const displayEmail = (user.email && user.email.endsWith('@customer.milasty.com')) ? '' : user.email;

    res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: displayEmail,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses || [],
      notification_preferences: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(user.notification_preferences || {}),
      },
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
    const shouldBeDefault = currentAddresses.length === 0 || !!newAddress.isDefault;

    // Enforce single default address
    const cleanedExisting = currentAddresses.map((addr) => ({
      ...addr,
      isDefault: shouldBeDefault ? false : (addr.isDefault ?? false),
    }));

    const addedItem = {
      ...newAddress,
      _id: addressId,
      id: addressId,
      isDefault: shouldBeDefault,
    };

    const updatedAddresses = [...cleanedExisting, addedItem];

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
    const isSettingDefault = !!addressData.isDefault;

    let updatedAddresses = currentAddresses.map((addr) => {
      const isTarget = addr._id === addressId || addr.id === addressId;
      if (isTarget) {
        return { ...addr, ...addressData, isDefault: isSettingDefault ? true : (addr.isDefault ?? false) };
      }
      return {
        ...addr,
        isDefault: isSettingDefault ? false : (addr.isDefault ?? false),
      };
    });

    // Ensure at least one default address exists if list non-empty
    if (updatedAddresses.length > 0 && !updatedAddresses.some((a) => a.isDefault)) {
      updatedAddresses[0].isDefault = true;
    }

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

// Set Default Address
export const setDefaultAddress = async (req, res) => {
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
    const updatedAddresses = currentAddresses.map((addr) => ({
      ...addr,
      isDefault: addr._id === addressId || addr.id === addressId,
    }));

    const { error: updateErr } = await supabase
      .from('users')
      .update({ addresses: updatedAddresses, updated_at: new Date() })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    res.json(updatedAddresses);
  } catch (error) {
    res.status(500).json({ message: 'Error setting default address', error: error.message });
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
    let updatedAddresses = currentAddresses.filter((addr) => addr._id !== addressId && addr.id !== addressId);

    // If remaining addresses exist and none is default, set first one as default
    if (updatedAddresses.length > 0 && !updatedAddresses.some((a) => a.isDefault)) {
      updatedAddresses[0].isDefault = true;
    }

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

    const displayEmail = (user.email && user.email.endsWith('@customer.milasty.com')) ? '' : user.email;

    res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: displayEmail,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses || [],
      notification_preferences: {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(user.notification_preferences || {}),
      },
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

    const { data: user } = await supabase.from('users').select('id, email, phone, name, password_hash').eq('id', userId).single();
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

    // Asynchronously dispatch WhatsApp customer security notification
    if (user?.phone) {
      triggerEventAsync('PASSWORD_CHANGED', { user, userId, phone: user.phone, name: user.name });
    }

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

// Forgot Password — Resend API + JWT reset token (no Supabase admin API, no nodemailer)
// Accepts the registered email or mobile number. The link always goes to the account's registered
// email address: there is no SMS provider configured, so a mobile number can't be verified by OTP.
export const forgotPassword = async (req, res) => {
  const genericReply = "If an account exists for these details, we'll send a password reset link to its registered email address shortly. Please check your Inbox and Spam folder.";
  try {
    const identifier = String(req.body.identifier ?? req.body.email ?? '').trim();

    if (!identifier) {
      return res.status(400).json({ message: 'Please enter your email address or mobile number' });
    }

    const byEmail = identifier.includes('@');
    const mobile = byEmail ? null : normalizeIndianMobile(identifier);
    if (byEmail ? !isEmailAddress(identifier) : !mobile) {
      return res.status(400).json({ message: 'Please enter a valid email address or 10-digit mobile number' });
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'https://milasty.vercel.app').replace(/\/$/, '');

    // 1. Find the account. Unknown details get the same reply, so this can't be used to probe accounts.
    let dbUser = null;
    if (byEmail) {
      const { data } = await supabase.from('users').select('id, name, email, password_hash').eq('email', identifier.toLowerCase()).maybeSingle();
      dbUser = data;
    } else {
      const owners = await findUsersByMobile(mobile, 'id, name, email, password_hash');
      if (owners.length > 1) console.warn(`[FORGOT PASSWORD] Mobile ${mobile} belongs to ${owners.length} accounts — not sending; customer must use their email.`);
      dbUser = owners.length === 1 ? owners[0] : null;
    }
    if (!dbUser?.email) {
      console.log(`[FORGOT PASSWORD] No unique account with an email for the ${byEmail ? 'email' : 'mobile number'} entered`);
      return res.json({ message: genericReply });
    }
    const cleanEmail = dbUser.email.toLowerCase();
    console.log(`[FORGOT PASSWORD] Request for account ${dbUser.id} (via ${byEmail ? 'email' : 'mobile'})`);

    // 2. Generate a secure JWT reset token (1 hour expiry), bound to this account and its current password
    const resetToken = jwt.sign(
      { sub: dbUser.id, email: cleanEmail, purpose: 'password_reset', pwv: passwordVersion(dbUser.password_hash) },
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
      return res.json({ message: genericReply });
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

    // Always respond with success (security: don't reveal if the account exists)
    res.json({ message: genericReply });
  } catch (error) {
    console.error('[FORGOT PASSWORD] Unhandled error:', error);
    res.status(500).json({ message: 'Error processing password reset request', error: error.message });
  }
};

/**
 * 3. SEND FORGOT PASSWORD WHATSAPP OTP
 * POST /api/auth/forgot-password/send-otp
 */
export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { phone: rawPhone, identifier } = req.body;
    const phone = normalizeIndianMobile(rawPhone || identifier);

    if (!phone) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    // Check account existence without exposing details (enumeration protection)
    const owners = await findUsersByMobile(phone, 'id, name, email, phone');
    if (owners.length === 0) {
      console.log(`[FORGOT PASSWORD OTP] No account found for mobile: ${phone}`);
      return res.json({
        success: true,
        message: 'If an account exists with this mobile number, a verification code has been sent to your WhatsApp.',
        resendCooldown: 60,
      });
    }

    const otpResult = await generateAndSendWhatsAppOtp({
      phone,
      purpose: 'forgot_password',
      ip: req.ip,
    });

    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.error, resendCooldown: otpResult.resendCooldown });
    }

    return res.json({
      success: true,
      message: 'Password reset code sent to your WhatsApp number.',
      resendCooldown: otpResult.resendCooldown || 60,
    });
  } catch (error) {
    console.error('[FORGOT PASSWORD OTP] Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending password reset code', error: error.message });
  }
};

/**
 * 4. VERIFY FORGOT PASSWORD WHATSAPP OTP
 * POST /api/auth/forgot-password/verify-otp
 */
export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { phone: rawPhone, otp } = req.body;
    const phone = normalizeIndianMobile(rawPhone);

    if (!phone) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
    }

    if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
      return res.status(400).json({ message: 'Please enter the 6-digit verification code' });
    }

    const verifyResult = await verifyWhatsAppOtp({
      phone,
      purpose: 'forgot_password',
      otp,
    });

    if (!verifyResult.success) {
      return res.status(400).json({
        message: verifyResult.error,
        remainingAttempts: verifyResult.remainingAttempts,
      });
    }

    // Find the associated account
    const owners = await findUsersByMobile(phone, 'id, name, email, phone, password_hash');
    if (owners.length === 0) {
      return res.status(404).json({ message: 'No account associated with this mobile number.' });
    }

    const user = owners[0];

    // Issue standard secure 15-minute reset token bound to this account and its password version
    const resetToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        phone: user.phone,
        purpose: 'password_reset',
        pwv: passwordVersion(user.password_hash),
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      success: true,
      message: 'Verification code confirmed. You may now set your new password.',
      token: resetToken,
      email: user.email,
    });
  } catch (error) {
    console.error('[FORGOT PASSWORD OTP] Error verifying OTP:', error);
    res.status(500).json({ message: 'Error verifying code', error: error.message });
  }
};



// Reset Password — supports both JWT reset tokens and Supabase access tokens
export const resetPassword = async (req, res) => {
  try {
    const { password, access_token, token } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Please enter a new password' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
      });
    }

    // The account is identified ONLY by proof of email ownership: our signed reset token or a Supabase
    // recovery session. An email address in the request body is never trusted on its own.
    let dbUser = null;

    // 1. Verify our JWT reset token (from Gmail/Resend email link)
    if (token) {
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (jwtErr) {
        if (jwtErr.name === 'TokenExpiredError') {
          return res.status(400).json({ message: 'This reset link has expired. Please request a new one.' });
        }
        return res.status(400).json({ message: 'Invalid reset token. Please request a new link.' });
      }
      if (decoded.purpose !== 'password_reset') {
        return res.status(400).json({ message: 'Invalid reset token. Please request a new link.' });
      }
      const query = supabase.from('users').select('id, email, phone, name, password_hash');
      const { data } = await (decoded.sub ? query.eq('id', decoded.sub) : query.eq('email', String(decoded.email || '').toLowerCase())).maybeSingle();
      dbUser = data;
      // Links issued since this release carry pwv: once the password changes, the link is spent
      if (dbUser && decoded.pwv && decoded.pwv !== passwordVersion(dbUser.password_hash)) {
        return res.status(400).json({ message: 'This reset link has already been used. Please request a new one.' });
      }
    } else if (access_token) {
      // 2. Supabase access_token (from the Supabase recovery email flow) — verified by Supabase
      try {
        const { data: userData } = await supabase.auth.getUser(access_token);
        const authEmail = userData?.user?.email?.toLowerCase();
        if (authEmail) {
          const { data } = await supabase.from('users').select('id, email, phone, name, password_hash').eq('email', authEmail).maybeSingle();
          dbUser = data;
        }
      } catch (e) {}
    }

    if (!dbUser) {
      return res.status(400).json({ message: 'This reset link is invalid. Please request a new password reset link.' });
    }

    console.log(`[RESET PASSWORD] Updating password for account ${dbUser.id}`);

    // 3. Update bcrypt hash in PostgreSQL users table
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date() })
      .eq('id', dbUser.id);

    if (updateErr) {
      console.error('[RESET PASSWORD] DB update error:', updateErr.message);
      return res.status(500).json({ message: 'Could not update your password. Please try again.' });
    }

    // 4. Also update Supabase Auth (best effort)
    try {
      await supabase.auth.admin.updateUserById(dbUser.id, { password });
    } catch (authErr) {
      console.warn('[RESET PASSWORD] Supabase Auth update warning:', authErr.message);
    }

    console.log(`[RESET PASSWORD] ✅ Password updated for account ${dbUser.id}`);

    // Asynchronously dispatch WhatsApp customer security notification
    if (dbUser?.phone) {
      triggerEventAsync('PASSWORD_RESET_COMPLETED', {
        user: dbUser,
        userId: dbUser.id,
        phone: dbUser.phone,
        name: dbUser.name,
      });
    }

    res.json({ message: 'Password updated successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('[RESET PASSWORD] Unhandled error:', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

// Sync registered Supabase Auth users to PostgreSQL public.users table safely
export const syncAuthUsersToProfiles = async () => {
  try {
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr || !authData?.users) {
      if (authErr) console.warn('[SYNC] Supabase Auth listUsers warning:', authErr.message);
      return;
    }

    const { data: dbUsers, error: dbErr } = await supabase.from('users').select('id, email');
    if (dbErr) {
      console.warn('[SYNC] Public users table fetch warning:', dbErr.message);
      return;
    }

    const existingEmailsMap = new Map((dbUsers || []).map((u) => [u.email?.toLowerCase(), u.id]));

    for (const authUser of authData.users) {
      const cleanEmail = authUser.email?.toLowerCase();
      if (!cleanEmail) continue;

      if (!existingEmailsMap.has(cleanEmail)) {
        const role = cleanEmail === 'admin@milasty.com' ? 'admin' : (authUser.user_metadata?.role || 'customer');
        const name = authUser.user_metadata?.name || cleanEmail.split('@')[0];
        const phone = authUser.user_metadata?.phone || authUser.phone || '';

        const { error: insertErr } = await supabase.from('users').insert([
          {
            id: authUser.id,
            name: name.trim(),
            email: cleanEmail,
            password_hash: '',
            phone: phone ? phone.trim() : '',
            role,
            created_at: authUser.created_at || new Date(),
            updated_at: new Date(),
          },
        ]);

        if (insertErr) {
          console.warn(`[SYNC] Failed to create profile for auth user ${cleanEmail}:`, insertErr.message);
        } else {
          console.log(`[SYNC] Successfully created profile for auth user: ${cleanEmail}`);
        }
      }
    }
  } catch (err) {
    console.warn('[SYNC] Exception during user profile sync:', err.message);
  }
};

/**
 * GET CUSTOMER NOTIFICATION PREFERENCES
 * GET /api/auth/preferences
 * Protected by protect middleware (auth required).
 * Strictly scoped to req.user.id.
 */
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, notification_preferences')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== '42703') {
      console.error('[USER PREFERENCES GET ERROR]', error);
      return res.status(500).json({ success: false, message: 'Error retrieving preferences' });
    }

    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(user?.notification_preferences || {}),
    };

    return res.json({
      success: true,
      preferences: {
        whatsapp: Boolean(prefs.whatsapp),
        whatsapp_promotional: Boolean(prefs.whatsapp_promotional),
      },
    });
  } catch (err) {
    console.error('[USER PREFERENCES GET EXCEPTION]', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving preferences' });
  }
};

/**
 * UPDATE CUSTOMER NOTIFICATION PREFERENCES
 * PUT /api/auth/preferences
 * Protected by protect middleware (auth required).
 * Strictly scoped to req.user.id (cannot modify other users).
 * Strict boolean validation on inputs.
 */
export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const bodyPrefs = req.body?.preferences || req.body || {};
    const { whatsapp, whatsapp_promotional } = bodyPrefs;

    // Strict validation: values, if provided, MUST be booleans
    if (typeof whatsapp !== 'undefined' && typeof whatsapp !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Field "whatsapp" must be a boolean (true or false)' });
    }
    if (typeof whatsapp_promotional !== 'undefined' && typeof whatsapp_promotional !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Field "whatsapp_promotional" must be a boolean (true or false)' });
    }

    // Fetch existing preferences
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, notification_preferences')
      .eq('id', userId)
      .maybeSingle();

    if (fetchErr && fetchErr.code !== '42703') {
      console.error('[USER PREFERENCES FETCH ERROR]', fetchErr);
      return res.status(500).json({ success: false, message: 'Error updating preferences' });
    }

    const currentPrefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(user?.notification_preferences || {}),
    };

    const newPrefs = {
      whatsapp: typeof whatsapp === 'boolean' ? whatsapp : currentPrefs.whatsapp,
      whatsapp_promotional: typeof whatsapp_promotional === 'boolean' ? whatsapp_promotional : currentPrefs.whatsapp_promotional,
    };

    // Update public.users
    const { error: updateErr } = await supabase
      .from('users')
      .update({
        notification_preferences: newPrefs,
        updated_at: new Date(),
      })
      .eq('id', userId);

    if (updateErr) {
      if (updateErr.code === '42703') {
        console.warn('[USER PREFERENCES] notification_preferences column not yet in DB schema. Returning updated preferences.');
      } else {
        console.error('[USER PREFERENCES UPDATE ERROR]', updateErr);
        return res.status(500).json({ success: false, message: 'Failed to update preferences in database' });
      }
    }

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: newPrefs,
    });
  } catch (err) {
    console.error('[USER PREFERENCES UPDATE EXCEPTION]', err);
    return res.status(500).json({ success: false, message: 'Server error updating preferences' });
  }
};

/**
 * GOOGLE SIGN-IN & SIGN-UP
 * POST /api/auth/google
 *
 * Verifies Google ID token / credential directly against Google's tokeninfo API.
 * Creates new customer record or safely links existing account with matching verified email.
 * Strictly prevents Google authentication from escalating privileges or creating admin accounts.
 * Returns standard MILASTY JWT session token compatible with all protected routes and cart merge.
 */
export const googleAuth = async (req, res) => {
  try {
    const { credential, token: inputToken, access_token } = req.body;
    const googleIdToken = credential || inputToken;

    if (!googleIdToken && !access_token) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    let payload = null;

    if (googleIdToken) {
      // 1. Verify Google ID token via Google tokeninfo endpoint
      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(googleIdToken)}`;
      const googleResp = await fetch(verifyUrl);

      if (!googleResp.ok) {
        const errData = await googleResp.json().catch(() => ({}));
        console.warn('[GOOGLE AUTH] Token verification failed:', errData);
        return res.status(401).json({ success: false, message: 'Invalid or expired Google authentication token' });
      }

      payload = await googleResp.json();
    } else if (access_token) {
      // Userinfo fallback for access token flow
      const userinfoResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!userinfoResp.ok) {
        return res.status(401).json({ success: false, message: 'Invalid Google access token' });
      }
      payload = await userinfoResp.json();
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Could not retrieve email from Google profile' });
    }

    // 2. Security validation: Verify email is verified by Google
    const isEmailVerified = payload.email_verified === true || String(payload.email_verified) === 'true';
    if (!isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Your Google email address is not verified. Please verify it with Google first.' });
    }

    // 3. Security validation: Validate audience if GOOGLE_CLIENT_ID configured
    const configuredClientId = process.env.GOOGLE_CLIENT_ID;
    if (configuredClientId && payload.aud && payload.aud !== configuredClientId) {
      console.error('[GOOGLE AUTH] Audience mismatch. Expected:', configuredClientId, 'Got:', payload.aud);
      return res.status(401).json({ success: false, message: 'Google authentication client ID mismatch' });
    }

    // 4. Security validation: Check issuer and expiry
    if (payload.iss && !payload.iss.includes('accounts.google.com')) {
      return res.status(401).json({ success: false, message: 'Invalid token issuer' });
    }
    if (payload.exp && Number(payload.exp) < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ success: false, message: 'Google authentication token has expired' });
    }

    const cleanEmail = String(payload.email).toLowerCase().trim();
    const googleSub = String(payload.sub || '');
    const fullName = String(payload.name || cleanEmail.split('@')[0] || 'Customer').trim();
    const avatarUrl = payload.picture || null;

    // 5. Check if user already exists (by google_id or verified email)
    let existingUser = null;

    // Try finding by google_id first
    if (googleSub) {
      const { data: userByGoogleId, error: googleErr } = await supabase
        .from('users')
        .select('*')
        .eq('google_id', googleSub)
        .maybeSingle();

      if (!googleErr && userByGoogleId) {
        existingUser = userByGoogleId;
      }
    }

    // If not found by google_id, match by verified email (safe account linking)
    if (!existingUser) {
      const { data: userByEmail, error: emailErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!emailErr && userByEmail) {
        existingUser = userByEmail;
      }
    }

    let finalUser = null;
    let isNewUser = false;

    if (existingUser) {
      finalUser = existingUser;

      // Update google_id and avatar if missing
      const updateData = { updated_at: new Date() };
      if (!existingUser.google_id && googleSub) {
        updateData.google_id = googleSub;
      }
      if (!existingUser.avatar_url && avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      if (Object.keys(updateData).length > 1) {
        const { data: updated, error: uErr } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', existingUser.id)
          .select('*')
          .maybeSingle();

        if (!uErr && updated) {
          finalUser = updated;
        }
      }
    } else {
      // 6. Create new customer account (Strictly customer role! Never admin.)
      isNewUser = true;
      const newAuthId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

      const baseInsert = {
        id: newAuthId,
        name: fullName,
        email: cleanEmail,
        password_hash: '', // No password; Google OAuth authenticated
        phone: '', // Phone number collected when needed (e.g. checkout)
        role: 'customer',
        notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Try inserting with google_id & avatar_url
      let { data: createdUser, error: insertErr } = await supabase
        .from('users')
        .insert([{ ...baseInsert, google_id: googleSub, avatar_url: avatarUrl }])
        .select('*')
        .single();

      // Retry without optional columns if migration 31 hasn't run yet in DB
      if (insertErr && (insertErr.code === '42703' || insertErr.message?.includes('google_id'))) {
        console.warn('[GOOGLE AUTH] google_id column not yet in DB schema. Inserting without it.');
        const retry = await supabase
          .from('users')
          .insert([baseInsert])
          .select('*')
          .single();
        createdUser = retry.data;
        insertErr = retry.error;
      }

      if (insertErr || !createdUser) {
        console.error('[GOOGLE AUTH] Failed to create user in DB:', insertErr);
        return res.status(500).json({ success: false, message: 'Database error creating customer account' });
      }

      finalUser = createdUser;

      // Asynchronously trigger customer registration WhatsApp alert
      triggerEventAsync('CUSTOMER_REGISTERED', {
        user: finalUser,
        name: finalUser.name,
        phone: finalUser.phone || '',
        email: finalUser.email,
      });
    }

    // 7. Check if user is disabled or blocked
    if (finalUser.role === 'disabled' || finalUser.role === 'blocked') {
      return res.status(403).json({
        success: false,
        code: 'CUSTOMER_BLOCKED',
        message: 'Your account is blocked by admin. Please contact support via enquiry form.',
      });
    }

    // 8. Issue standard MILASTY JWT session token
    const token = jwt.sign(
      { id: finalUser.id, role: finalUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const displayEmail = (finalUser.email && finalUser.email.endsWith('@customer.milasty.com')) ? '' : finalUser.email;

    return res.json({
      success: true,
      message: isNewUser ? 'Welcome to MILASTY! Account created with Google.' : 'Welcome back!',
      isNewUser,
      _id: finalUser.id,
      id: finalUser.id,
      name: finalUser.name,
      email: displayEmail,
      phone: finalUser.phone || '',
      role: finalUser.role,
      addresses: finalUser.addresses || [],
      notification_preferences: finalUser.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES,
      avatar_url: finalUser.avatar_url || avatarUrl || null,
      token,
    });
  } catch (error) {
    console.error('[GOOGLE AUTH EXCEPTION]', error);
    return res.status(500).json({ success: false, message: 'Error authenticating with Google', error: error.message });
  }
};


