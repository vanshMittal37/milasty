import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'milasty_super_secret_jwt_key_2026');
      
      const targetId = decoded.id || decoded._id || decoded.userId;

      let dbUser = null;
      try {
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone, role')
          .eq('id', targetId)
          .maybeSingle();
        dbUser = data;
      } catch (e) {
        // Fallback to token payload
      }

      req.user = {
        id: targetId,
        _id: targetId,
        name: dbUser?.name || decoded.name || 'Customer',
        email: dbUser?.email || decoded.email || '',
        phone: dbUser?.phone || decoded.phone || '',
        role: dbUser?.role || decoded.role || 'customer',
        ...(dbUser || {}),
      };

      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User account not found' });
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

export const admin = adminOnly;

export const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'milasty_super_secret_jwt_key_2026');
      
      const targetId = decoded.id || decoded._id || decoded.userId;

      let dbUser = null;
      try {
        const { data } = await supabase
          .from('users')
          .select('id, name, email, phone, role')
          .eq('id', targetId)
          .maybeSingle();
        dbUser = data;
      } catch (e) {
        // Fallback to token payload
      }

      req.user = {
        id: targetId,
        _id: targetId,
        name: dbUser?.name || decoded.name || 'Customer',
        email: dbUser?.email || decoded.email || '',
        phone: dbUser?.phone || decoded.phone || '',
        role: dbUser?.role || decoded.role || 'customer',
        ...(dbUser || {}),
      };
    } catch (error) {
      // Ignore token failure for optional verification
    }
  }
  next();
};

