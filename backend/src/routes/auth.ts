import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'flowvibe-secret-key-2024';

interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: string;
  is_active: boolean;
  subscription_tier: string;
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users(email, password_hash, display_name, role) VALUES($1, $2, $3, $4) RETURNING *',
      [email, passwordHash, displayName || email.split('@')[0], 'user']
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  console.log(`Login attempt from ${clientIP} for ${req.body.email}`);
  
  try {
    const { email, password } = req.body;
    
    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account blocked' });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Set HttpOnly cookie for token
    res.cookie('flowvibe_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    res.json({
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        role: user.role,
        subscriptionTier: user.subscription_tier
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const result = await query('SELECT id, email, display_name, role, subscription_tier FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        role: user.role,
        subscriptionTier: user.subscription_tier
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
export { JWT_SECRET };