import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'milasty_super_secret_jwt_key_2026');
      
      const targetId = decoded.id || decoded._id || decoded.userId;

      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, name, email, phone, role, addresses')
          .eq('id', targetId)
          .maybeSingle();

        if (dbUser) {
          req.user = {
            ...dbUser,
            _id: dbUser.id,
            id: dbUser.id,
          };
        } else {
          req.user = {
            id: targetId,
            _id: targetId,
            role: decoded.role || 'customer',
          };
        }
      } catch (e) {
        req.user = {
          id: targetId,
          _id: targetId,
          role: decoded.role || 'customer',
        };
      }

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

      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, name, email, phone, role, addresses')
          .eq('id', targetId)
          .maybeSingle();

        if (dbUser) {
          req.user = {
            ...dbUser,
            _id: dbUser.id,
            id: dbUser.id,
          };
        } else {
          req.user = {
            id: targetId,
            _id: targetId,
            role: decoded.role || 'customer',
          };
        }
      } catch (e) {
        req.user = {
          id: targetId,
          _id: targetId,
          role: decoded.role || 'customer',
        };
      }
    } catch (error) {
      // Ignore token failure for optional verification
    }
  }
  next();
};

