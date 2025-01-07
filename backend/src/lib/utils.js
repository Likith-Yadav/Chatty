import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  // Ensure JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined');
    throw new Error('JWT configuration error');
  }

  try {
    // Generate a more robust token with additional claims
    const token = jwt.sign(
      { 
        userId, 
        // Add a unique session identifier
        sessionId: Date.now().toString() + Math.random().toString(36).substring(2)
      }, 
      process.env.JWT_SECRET, 
      {
        expiresIn: "15d", // Extended expiration time
        algorithm: 'HS256' // Explicitly set algorithm
      }
    );

    // Enhanced cookie settings for better cross-browser support
    res.cookie("jwt", token, {
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
      httpOnly: true, // Prevent client-side JS access
      sameSite: 'None', // Required for cross-site cookies
      secure: true, // HTTPS only
      path: '/', // Accessible across entire domain
      // Explicitly set domain for Render deployment
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    return token;
  } catch (error) {
    console.error('Token generation error:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error('Failed to generate authentication token');
  }
};

// Function to regenerate token on page refresh
export const regenerateToken = (userId, res) => {
  try {
    // Remove existing token
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'None',
      secure: true,
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    // Generate and set new token
    return generateToken(userId, res);
  } catch (error) {
    console.error('Token regeneration error:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error('Failed to regenerate authentication token');
  }
};

// Optional: Add a function to invalidate tokens
export const invalidateToken = (res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0), // Expire immediately
    sameSite: 'None',
    secure: true,
    path: '/',
    domain: process.env.COOKIE_DOMAIN || undefined
  });
};