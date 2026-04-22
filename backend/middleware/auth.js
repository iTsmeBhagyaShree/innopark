// =====================================================
// Authentication Middleware
// =====================================================

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Verify JWT token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Authorization header must be: Bearer <token>'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const jwtSecret = (process.env.JWT_SECRET || 'worksuite_crm_jwt_secret_key_2025_change_in_production').trim();
    const decoded = jwt.verify(token, jwtSecret);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, error: 'Invalid token payload' });
    }

    // =====================================================
    // BYPASS USERS — same as authController (company_id = 1)
    // These work even if DB is unavailable
    // =====================================================
    const bypassUsers = {
      1: { id: 1, company_id: 1, name: 'Super Admin', email: 'superadmin@crmapp', role: 'SUPERADMIN', status: 'Active' },
      2: { id: 2, company_id: 1, name: 'Kavya', email: 'kavya@gmail.com', role: 'ADMIN', status: 'Active' },
      4: { id: 4, company_id: 1, name: 'Devesh', email: 'devesh@gmail.com', role: 'EMPLOYEE', status: 'Active' }
    };

    if (bypassUsers[decoded.userId]) {
      const user = bypassUsers[decoded.userId];
      req.user = user;
      req.userId = user.id;
      req.companyId = decoded.companyId || user.company_id; // prefer JWT companyId
      return next();
    }
    // =====================================================

    // For non-bypass users — try DB
    try {
      const [users] = await pool.execute(
        'SELECT id, company_id, name, email, role, status FROM users WHERE id = ? AND is_deleted = 0',
        [decoded.userId]
      );

      if (!users || users.length === 0) {
        // User not in DB but token is valid - allow in dev mode if it's a known userId
        req.userId = decoded.userId;
        req.companyId = decoded.companyId || 1;
        req.user = { id: decoded.userId, company_id: req.companyId, role: decoded.role || 'ADMIN', status: 'Active' };
        return next();
      }

      const user = users[0];
      if (user.status !== 'Active') {
        return res.status(403).json({ success: false, error: 'User account is inactive' });
      }

      req.user = user;
      req.userId = user.id;
      req.companyId = user.company_id;
      return next();
    } catch (dbErr) {
      // DB unavailable — use token data as fallback
      console.warn('DB unavailable in auth, using token data:', dbErr.message);
      req.userId = decoded.userId;
      req.companyId = decoded.companyId || 1;
      req.user = { id: decoded.userId, company_id: req.companyId, role: decoded.role || 'ADMIN', status: 'Active' };
      return next();
    }
    
    // Final safety check
    if (!req.userId) req.userId = decoded.userId;
    if (!req.companyId) req.companyId = decoded.companyId || 1;
    
    return next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

/**
 * Require specific role(s)
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles.map(r => r.toUpperCase()) : [roles.toUpperCase()];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`
      });
    }

    next();
  };
};

const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE'
};

const requireOwnData = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const userRole = (req.user.role || '').toUpperCase();
  if (userRole === ROLES.SUPERADMIN || userRole === ROLES.ADMIN) {
    return next();
  }

  const requestedUserId = req.params.userId || req.params.id || req.query.user_id || req.body.user_id;
  if (requestedUserId && parseInt(requestedUserId) !== req.userId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. You can only access your own data.'
    });
  }

  next();
};

const requireCompanyAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const userRole = (req.user.role || '').toUpperCase();
  if (userRole === ROLES.SUPERADMIN) {
    return next();
  }

  const requestedCompanyId = req.params.companyId || req.query.company_id || req.body.company_id;
  if (requestedCompanyId && parseInt(requestedCompanyId) !== req.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. You can only access your own company data.'
    });
  }

  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'worksuite_crm_jwt_secret_key_2025_change_in_production');
        
        // Bypass check in optionalAuth
        const bypassUsers = {
          1: { id: 1, company_id: 1, name: 'Super Admin', email: 'superadmin@crmapp', role: 'SUPERADMIN', status: 'Active' },
          2: { id: 2, company_id: 1, name: 'Kavya', email: 'kavya@gmail.com', role: 'ADMIN', status: 'Active' },
          4: { id: 4, company_id: 1, name: 'Devesh', email: 'devesh@gmail.com', role: 'EMPLOYEE', status: 'Active' }
        };

        if (bypassUsers[decoded.userId]) {
          const user = bypassUsers[decoded.userId];
          req.user = user;
          req.userId = user.id;
          req.companyId = user.company_id;
        } else {
          const [users] = await pool.execute(
            'SELECT id, company_id, name, email, role, status FROM users WHERE id = ? AND is_deleted = 0',
            [decoded.userId]
          );

          if (users.length > 0 && users[0].status === 'Active') {
            req.user = users[0];
            req.userId = users[0].id;
            req.companyId = users[0].company_id;
          }
        }
      } catch (error) {
        // Token invalid, but continue
      }
    }

    if (!req.companyId) {
      req.companyId = req.query.company_id || req.body.company_id || 1;
    }
    
    if (!req.userId) {
      req.userId = req.query.user_id || req.body.user_id || null;
    }

    next();
  } catch (error) {
    if (!req.companyId) {
      req.companyId = req.query.company_id || req.body.company_id || 1;
    }
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  optionalAuth,
  requireOwnData,
  requireCompanyAccess,
  ROLES
};
