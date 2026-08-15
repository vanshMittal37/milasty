import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'milasty_super_secret_jwt_key_2026');
      
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (e) {
        req.user = decoded; // Fallback for memory users
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User account not found' });
      }

      if (req.user.status === 'disabled') {
        return res.status(403).json({ message: 'Your account has been disabled by the admin' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

export const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'milasty_super_secret_jwt_key_2026');
      
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (e) {
        req.user = decoded;
      }
    } catch (error) {
      // Ignore token failure for optional verification
    }
  }
  next();
};
