import { Router } from 'express';
import { JWT_SECRET } from './auth.js';
import jwt from 'jsonwebtoken';
import { 
  getUserChatbots, getAllChatbots, getChatbotById, updateChatbot, deleteChatbot, createChatbot,
  getChatbotBookings, getChatbotLeads, getChatbotConversations,
  getDashboardStats, getAllLeads, getChatbotAnalytics,
  searchUsers, searchChatbots, searchLeads
} from '../db/db.js';

const router = Router();

// Middleware to verify JWT
const auth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const adminOnly = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.get('/analytics', auth, async (req, res) => {
  try {
    const chatbotId = req.query.chatbotId as string;
    const period = (req.query.period as '7d' | '30d' | '90d') || '7d';
    if (!chatbotId) {
      return res.status(400).json({ error: 'chatbotId is required' });
    }
    if (!['7d', '30d', '90d'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period' });
    }
    const bot = await getChatbotById(chatbotId);
    if (!bot) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && bot.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const data = await getChatbotAnalytics(chatbotId, period);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// ==================== CHATBOTS ====================
router.get('/chatbots', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getUserChatbots(req.user.userId, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chatbots' });
  }
});

router.get('/chatbots/all', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getAllChatbots(page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chatbots' });
  }
});

router.get('/chatbots/:id', auth, async (req, res) => {
  try {
    const bot = await getChatbotById(req.params.id);
    if (!bot) return res.status(404).json({ error: 'Not found' });
    res.json(bot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chatbot' });
  }
});

router.post('/chatbots', auth, async (req, res) => {
  try {
    const { name, industry, description, tone, flow_data } = req.body;
    if (!name || !industry) {
      return res.status(400).json({ error: 'name and industry are required' });
    }
    const bot = await createChatbot(req.user.userId, name, industry, description, tone, flow_data);
    res.json(bot);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chatbot' });
  }
});

router.put('/chatbots/:id', auth, async (req, res) => {
  try {
    const bot = await getChatbotById(req.params.id);
    if (!bot) return res.status(404).json({ error: 'Not found' });
    // Ownership check
    if (req.user.role !== 'admin' && bot.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await updateChatbot(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update chatbot' });
  }
});

router.delete('/chatbots/:id', auth, async (req, res) => {
  try {
    const bot = await getChatbotById(req.params.id);
    if (!bot) return res.status(404).json({ error: 'Not found' });
    // Ownership check
    if (req.user.role !== 'admin' && bot.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await deleteChatbot(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chatbot' });
  }
});

// ==================== BOOKINGS ====================
router.get('/bookings', auth, async (req, res) => {
  try {
    const chatbotId = req.query.chatbotId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getChatbotBookings(chatbotId, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// ==================== LEADS ====================
router.get('/leads', auth, async (req, res) => {
  try {
    const chatbotId = req.query.chatbotId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = chatbotId 
      ? await getChatbotLeads(chatbotId, page, limit)
      : await getAllLeads(page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leads' });
  }
});

// ==================== CONVERSATIONS ====================
router.get('/conversations', auth, async (req, res) => {
  try {
    const chatbotId = req.query.chatbotId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getChatbotConversations(chatbotId, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// ==================== SEARCH ====================
router.get('/search/users', auth, adminOnly, async (req, res) => {
  try {
    const q = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await searchUsers(q, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/search/chatbots', auth, adminOnly, async (req, res) => {
  try {
    const q = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await searchChatbots(q, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/search/leads', auth, adminOnly, async (req, res) => {
  try {
    const q = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await searchLeads(q, page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;