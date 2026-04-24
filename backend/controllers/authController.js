// =====================================================
// Authentication Controller
// =====================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Hardcoded Data for Bypass
const BYPASS_USERS_DATA = {
  1: { id: 1, company_id: 1, name: 'Super Admin', email: 'superadmin@crmapp', role: 'SUPERADMIN', status: 'Active', company_name: 'Innopark Demo' },
  2: { id: 2, company_id: 1, name: 'Kavya', email: 'kavya@gmail.com', role: 'ADMIN', status: 'Active', company_name: 'Innopark Demo' },
  4: { id: 4, company_id: 1, name: 'Devesh', email: 'devesh@gmail.com', role: 'EMPLOYEE', status: 'Active', company_name: 'Innopark Demo' }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: req.t ? req.t('api_msg_5f4480ad') : "Email, Password and Role are required" });
    }

    const normalizedRole = (role || '').toUpperCase().replace(/\s/g, '_');
    
    console.log(`Login Attempt: Email=${email}, Role=${role}, NormalizedRole=${normalizedRole}`);

    // =====================================================
    // LOGIN BYPASS (Works even if DB is offline)
    // =====================================================
    const bypassEmails = {
      'superadmin@crmapp': BYPASS_USERS_DATA[1],
      'kavya@gmail.com': BYPASS_USERS_DATA[2],
      'devesh@gmail.com': BYPASS_USERS_DATA[4]
    };

    if (bypassEmails[email] && password === '123456') {
      const user = bypassEmails[email];
      
      const token = jwt.sign(
        { userId: user.id, companyId: user.company_id, role: user.role },
        process.env.JWT_SECRET || 'worksuite_crm_jwt_secret_key_2025_change_in_production',
        { expiresIn: '24h' }
      );
      
      console.log(`Bypass Success for ${email}`);
      return res.json({
        success: true,
        token,
        user: { id: user.id, company_id: user.company_id, name: user.name, email, role: user.role, company_name: user.company_name }
      });
    }
    // =====================================================

    // Fallback to database
    const [users] = await pool.execute(
      `SELECT id, company_id, name, email, password, role, status FROM users WHERE email = ? AND UPPER(role) = ? AND is_deleted = 0`,
      [email, normalizedRole]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: req.t ? req.t('api_msg_e6839791') : "Invalid credentials" });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ success: false, error: req.t ? req.t('api_msg_e6839791') : "Invalid credentials" });

    const jwtSecret = process.env.JWT_SECRET || 'worksuite_crm_jwt_secret_key_2025_change_in_production';
    const token = jwt.sign(
      { userId: user.id, companyId: user.company_id, role: user.role }, 
      jwtSecret, 
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, company_id: user.company_id, name: user.name, email: user.email, role: user.role } 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: req.t ? req.t('api_msg_48649d8c') : "Login failed" });
  }
};

/**
 * Get current user (With Bypass)
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId || req.query.user_id || req.body.user_id;
    if (!userId) return res.status(400).json({ success: false, error: req.t ? req.t('api_msg_56a8e6a1') : "User ID required" });

    // =====================================================
    // GET CURRENT USER BYPASS
    // =====================================================
    if (BYPASS_USERS_DATA[userId]) {
      return res.json({ success: true, data: BYPASS_USERS_DATA[userId] });
    }
    // =====================================================

    const [users] = await pool.execute(
      `SELECT u.id, u.company_id, u.name, u.email, u.role, u.status FROM users u WHERE u.id = ? AND u.is_deleted = 0`,
      [userId]
    );

    if (users.length === 0) return res.status(404).json({ success: false, error: req.t ? req.t('api_msg_b846d114') : "User not found" });

    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, error: req.t ? req.t('api_msg_d7c8c85b') : "Failed" });
  }
};

const logout = async (req, res) => res.json({ success: true });

const updateCurrentUser = async (req, res) => res.status(501).json({ success: false, error: req.t ? req.t('api_msg_72ba9b19') : "Not implemented in bypass mode" });

const changePassword = async (req, res) => res.status(501).json({ success: false, error: req.t ? req.t('api_msg_72ba9b19') : "Not implemented in bypass mode" });

module.exports = {
  login,
  logout,
  getCurrentUser,
  updateCurrentUser,
  changePassword
};
