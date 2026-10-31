import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { normalizeIndianMobile, isEmailAddress } from '../utils/phone.js';
import { generateAndSendWhatsAppOtp, verifyWhatsAppOtp } from '../services/otpService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'milasty_super_secret_jwt_key_2026';

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

    // An account that already has a password belongs to someone — registering again must never
    // replace its password (that would hand the account to whoever knows the email address).
    // Only password-less profiles (created from orders / Auth sync) may be claimed here.
    if (existingDbUser?.password_hash) {
      return res.status(400).json({ message: 'This email address is already registered. Please log in instead.' });
    }

    // Mobile login identifies the account by its number, so a number may belong to only one account
    const phoneOwners = await findUsersByMobile(phone);
    if (phoneOwners.some((u) => u.id !== existingDbUser?.id)) {
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

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please enter your email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if email is already registered with a password
    const { data: existingDbUser } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingDbUser?.password_hash) {
      return res.status(400).json({ message: 'This email address is already registered. Please log in instead.' });
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
      const query = supabase.from('users').select('id, email, password_hash');
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
          const { data } = await supabase.from('users').select('id, email, password_hash').eq('email', authEmail).maybeSingle();
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



