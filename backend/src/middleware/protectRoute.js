import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ error: "Not authorized, no token" });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      req.user = user;
      next();
    } catch (verifyError) {
      console.error('Token verification error:', verifyError);
      
      if (verifyError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      return res.status(401).json({ error: 'Not authorized, invalid token' });
    }
  } catch (error) {
    console.error('Protect route error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export { protectRoute };