import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'milasty_super_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: 'customer',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await user.matchPassword(password))) {
      if (user.status === 'disabled') {
        return res.status(403).json({ message: 'Your account has been disabled by the admin' });
      }

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        token: generateToken(user._id, user.role),
      });
    }

    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newAddress = req.body;
    if (newAddress.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    } else if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { addressId } = req.params;
    const updatedData = req.body;

    const addrIndex = user.addresses.findIndex((a) => a._id.toString() === addressId);
    if (addrIndex === -1) return res.status(404).json({ message: 'Address not found' });

    user.addresses[addrIndex] = { ...user.addresses[addrIndex].toObject(), ...updatedData };

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email address' });
    }
    // Simple reset token simulation
    res.json({ message: 'Password reset link sent to your registered email address' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reset email', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;

    await user.save();
    
    const updatedUser = await User.findById(req.user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};
