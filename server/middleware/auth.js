// server/middleware/auth.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ------------------------
// JWT AUTHENTICATION
// ------------------------
const protect = async (req, res, next) => {
  try {
    let token;

    // Expect: Authorization: Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in DB
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token invalid",
    });
  }
};

// ------------------------
// ROLE AUTHORIZATION
// ------------------------
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user missing",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: insufficient permissions",
      });
    }

    next();
  };
};

module.exports = { protect, allowRoles };
