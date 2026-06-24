const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};

const nutritionistOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'nutritionist')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Nutritionist or Admin privileges required' });
  }
};

module.exports = { adminOnly, nutritionistOrAdmin };
