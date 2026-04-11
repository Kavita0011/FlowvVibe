import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import bookingsRouter from './routes/bookings.js';
import webhooksRouter from './routes/webhooks.js';
import emailRouter from './routes/email.js';
import handoffRouter from './routes/handoff.js';
import callRouter from './routes/call.js';
import authRouter from './routes/auth.js';
import apiRouter from './routes/api.js';
import slackRouter from './routes/slack.js';
import whatsappRouter from './routes/whatsapp.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(compression());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

interface Chatbot {
  id: string;
  userId: string;
  name: string;
  industry: string;
  flow: FlowData;
  createdAt: string;
}

interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  chatbotId: string;
  messages: Message[];
  startedAt: string;
  context: Record<string, unknown>;
}

const chatbots: Map<string, Chatbot> = new Map();
const conversations: Map<string, Conversation> = new Map();

app.post('/api/chatbots', (req, res) => {
  const { userId, name, industry, flow } = req.body;
  const chatbot: Chatbot = {
    id: uuidv4(),
    userId,
    name,
    industry,
    flow: flow || { nodes: [], edges: [] },
    createdAt: new Date().toISOString()
  };
  chatbots.set(chatbot.id, chatbot);
  res.json(chatbot);
});

app.get('/api/chatbots/:userId', (req, res) => {
  const userBots = Array.from(chatbots.values()).filter(b => b.userId === req.params.userId);
  res.json(userBots);
});

app.get('/api/chatbots/:id', (req, res) => {
  const bot = chatbots.get(req.params.id);
  if (!bot) return res.status(404).json({ error: 'Chatbot not found' });
  res.json(bot);
});

app.put('/api/chatbots/:id', (req, res) => {
  const bot = chatbots.get(req.params.id);
  if (!bot) return res.status(404).json({ error: 'Chatbot not found' });
  const updated = { ...bot, ...req.body, id: bot.id };
  chatbots.set(bot.id, updated);
  res.json(updated);
});

app.delete('/api/chatbots/:id', (req, res) => {
  chatbots.delete(req.params.id);
  res.json({ success: true });
});

app.post('/api/chat/:chatbotId', (req, res) => {
  const { message, context = {} } = req.body;
  const chatbot = chatbots.get(req.params.chatbotId);
  
  if (!chatbot) {
    return res.status(404).json({ error: 'Chatbot not found' });
  }

  const sessionId = context.sessionId || uuidv4();
  let conversation = conversations.get(sessionId);
  
  if (!conversation) {
    conversation = {
      id: sessionId,
      chatbotId: chatbot.id,
      messages: [],
      startedAt: new Date().toISOString(),
      context: {}
    };
    conversations.set(sessionId, conversation);
  }

  conversation.messages.push({
    id: uuidv4(),
    conversationId: sessionId,
    sender: 'user',
    content: message,
    timestamp: new Date().toISOString()
  });

  const response = generateAIResponse(chatbot, message, conversation);

  conversation.messages.push({
    id: uuidv4(),
    conversationId: sessionId,
    sender: 'bot',
    content: response.content,
    timestamp: new Date().toISOString()
  });

  res.json({
    conversationId: sessionId,
    response: response.content,
    intent: response.intent,
    sentiment: response.sentiment
  });
});

app.get('/api/conversations/:chatbotId', (req, res) => {
  const botConversations = Array.from(conversations.values())
    .filter(c => c.chatbotId === req.params.chatbotId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  res.json(botConversations);
});

app.post('/api/ai/generate-flow', async (req, res) => {
  const { prd } = req.body;
  
  try {
    const flow = await generateFlowWithAI(prd);
    res.json(flow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate flow' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  const { message, knowledgeBase, conversationHistory } = req.body;
  
  try {
    const response = await generateAIResponseWithRAG(message, knowledgeBase, conversationHistory);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

function generateAIResponse(chatbot: Chatbot, userMessage: string, conversation: Conversation): { content: string; intent: string; sentiment: string } {
  const message = userMessage.toLowerCase();
  
  let intent = 'general';
  let sentiment = 'neutral';
  
  if (['hello', 'hi', 'hey'].some(k => message.includes(k))) {
    intent = 'greeting';
  } else if (['help', 'support', 'issue'].some(k => message.includes(k))) {
    intent = 'support';
  } else if (['price', 'cost', 'pricing'].some(k => message.includes(k))) {
    intent = 'pricing';
  } else if (['order', 'delivery', 'ship'].some(k => message.includes(k))) {
    intent = 'order';
  } else if (['thank', 'thanks', 'bye'].some(k => message.includes(k))) {
    intent = 'farewell';
  }

  if (['angry', 'frustrated', 'terrible', 'worst'].some(k => message.includes(k))) {
    sentiment = 'negative';
  } else if (['great', 'awesome', 'love', 'amazing'].some(k => message.includes(k))) {
    sentiment = 'positive';
  }

  let content = "I understand. Let me help you with that.";
  
  for (const node of chatbot.flow.nodes) {
    if (node.type === 'aiResponse' && node.data.intent === intent) {
      content = node.data.message as string || content;
      break;
    }
  }

  const fallbackResponses: Record<string, string> = {
    greeting: "Hello! Welcome! How can I help you today?",
    support: "I'm here to help! What issue are you facing?",
    pricing: "I'd be happy to discuss our pricing. What specific service are you interested in?",
    order: "For order inquiries, please provide your order number.",
    farewell: "Thank you for chatting! Have a great day!",
    general: "I understand. Could you please provide more details?"
  };

  if (!chatbot.flow.nodes.length) {
    content = fallbackResponses[intent] || fallbackResponses.general;
  }

  return { content, intent, sentiment };
}

async function generateFlowWithAI(prd: Record<string, unknown>): Promise<FlowData> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  if (!openRouterKey) {
    return {
      nodes: [
        { id: 'start', type: 'start', position: { x: 100, y: 200 }, data: { label: 'Start', message: `Welcome to ${prd.companyName || 'our company'}! How can I help you?` } },
        { id: 'end', type: 'end', position: { x: 500, y: 200 }, data: { label: 'End', message: 'Thank you for chatting!' } }
      ],
      edges: [{ id: 'e1', source: 'start', target: 'end' }]
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://flowvibe.ai',
        'X-Title': 'FlowvVibe'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [{
          role: 'user',
          content: `Create a conversation flow JSON for a ${prd.tone || 'friendly'} AI chatbot for ${prd.companyName} in ${prd.industry} industry.
          
          Target: ${prd.targetAudience}
          Services: ${(prd.services as string[])?.join(', ')}
          FAQ: ${(prd.faq as Array<{ question: string; answer: string }>)?.map(f => `Q: ${f.question} A: ${f.answer}`).join('; ')}
          
          Create nodes: START, AI responses for each FAQ, intent detection, conditions, and END.
          Return ONLY JSON: {"nodes": [...], "edges": [...]}`
        }]
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return {
      nodes: [
        { id: 'start', type: 'start', position: { x: 100, y: 200 }, data: { label: 'Start', message: `Welcome to ${prd.companyName}!` } },
        { id: 'end', type: 'end', position: { x: 500, y: 200 }, data: { label: 'End', message: 'Goodbye!' } }
      ],
      edges: [{ id: 'e1', source: 'start', target: 'end' }]
    };
  }
}

async function generateAIResponseWithRAG(message: string, knowledgeBase: string[], history: Array<{ role: string; content: string }>): Promise<{ content: string; sources: string[] }> {
  const relevantDocs = knowledgeBase.filter(doc => 
    doc.toLowerCase().includes(message.toLowerCase().split(' ')[0])
  );

  const context = relevantDocs.join('\n\n');
  
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  if (!openRouterKey || !relevantDocs.length) {
    return {
      content: relevantDocs[0] || "I don't have specific information about that. Let me transfer you to a human agent.",
      sources: relevantDocs
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          ...history.slice(-5).map(m => ({ role: m.role, content: m.content })),
          { role: 'system', content: `Use this knowledge base to answer:\n${context}` },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      sources: relevantDocs
    };
  } catch {
    return {
      content: relevantDocs[0] || "I'm having trouble finding that information.",
      sources: relevantDocs
    };
  }
}

app.use('/api/bookings', bookingsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/email', emailRouter);
app.use('/api/handoff', handoffRouter);
app.use('/api/call', callRouter);
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);
app.use('/api/slack', slackRouter);
app.use('/api/whatsapp', whatsappRouter);

app.listen(PORT, () => {
  console.log(`FlowvVibe API running on port ${PORT}`);
});

export default app;