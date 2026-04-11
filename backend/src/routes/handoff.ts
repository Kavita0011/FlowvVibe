import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface Agent {
  id: string;
  email: string;
  name: string;
  online: boolean;
  maxChats: number;
  activeChats: number;
}

interface ChatSession {
  id: string;
  chatbotId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  agentId?: string;
  status: 'waiting' | 'active' | 'closed';
  startedAt: string;
  messages: { sender: string; content: string; timestamp: string }[];
}

const agents = new Map<string, Agent>();
const sessions = new Map<string, ChatSession>();

router.post('/agent', (req, res) => {
  const { email, name, maxChats = 5 } = req.body;
  const agent: Agent = { id: uuidv4(), email, name, online: true, maxChats, activeChats: 0 };
  agents.set(agent.id, agent);
  res.json(agent);
});

router.get('/agents', (req, res) => {
  const onlineAgents = Array.from(agents.values()).filter(a => a.online && a.activeChats < a.maxChats);
  res.json(onlineAgents);
});

router.post('/transfer', (req, res) => {
  const { chatbotId, customerId, customerName, customerEmail } = req.body;
  const session: ChatSession = {
    id: uuidv4(),
    chatbotId,
    customerId,
    customerName,
    customerEmail,
    status: 'waiting',
    startedAt: new Date().toISOString(),
    messages: []
  };
  sessions.set(session.id, session);
  res.json({ sessionId: session.id, status: 'waiting' });
});

router.get('/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.post('/session/:sessionId/message', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  const { sender, content } = req.body;
  session.messages.push({ sender, content, timestamp: new Date().toISOString() });
  sessions.set(session.id, session);
  res.json(session);
});

router.post('/session/:sessionId/close', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  session.status = 'closed';
  sessions.set(session.id, session);
  if (session.agentId) {
    const agent = agents.get(session.agentId);
    if (agent) { agent.activeChats = Math.max(0, agent.activeChats - 1); agents.set(agent.id, agent); }
  }
  res.json({ success: true });
});

export default router;