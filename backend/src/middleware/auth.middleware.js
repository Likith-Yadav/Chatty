import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    console.log('Protect route middleware called');
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request cookies:', req.cookies);

    // Check for token in different locations
    let token = 
      req.cookies.jwt ||  // Cookie-based token
      req.headers.authorization?.split(' ')[1] || // Bearer token
      req.headers['x-access-token'];  // Alternative header

    console.log('Token found:', !!token);

    if (!token) {
      console.log('No token found');
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
    } catch (verifyError) {
      console.log('JWT verification error:', verifyError.message);
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    if (!decoded) {
      console.log('Decoded token is empty');
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log('No user found for decoded token');
      return res.status(404).json({ message: "User not found" });
    }

    console.log('User authenticated:', user._id);
    req.user = user;

    next();
  } catch (error) {
    console.error('Detailed error in protectRoute middleware:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      path: req.path,
      method: req.method
    });

    res.status(500).json({ message: "Internal server error" });
  }
};
