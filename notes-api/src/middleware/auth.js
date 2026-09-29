const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Not authenticated. Token required.'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token.'));
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Access denied. Insufficient role.'));
    }
    next();
  };
};

module.exports = { isAuthenticated, requireRole };