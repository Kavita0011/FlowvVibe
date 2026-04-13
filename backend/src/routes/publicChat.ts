import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getChatbotById,
  ensureConversation,
  addMessage,
  query,
  getRecentMessagesForConversation,
} from '../db/db.js';
import { parseFlowData, runConversationTurn } from '../services/chatEngine.js';

const router = Router();

router.post('/chat/:chatbotId', async (req, res) => {
  try {
    const { message, context = {} } = req.body as {
      message?: string;
      context?: { sessionId?: string };
    };
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const chatbot = await getChatbotById(req.params.chatbotId);
    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }

    const flow = parseFlowData(chatbot.flow_data);
    const sessionId = context.sessionId || uuidv4();
    const conversation = await ensureConversation(chatbot.id, sessionId);

    await addMessage({
      conversationId: conversation.id,
      sender: 'user',
      content: message,
    });

    const rows = await getRecentMessagesForConversation(conversation.id, 32);
    const history = rows.map((r) => ({
      role: r.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: r.content,
    }));

    const response = await runConversationTurn({
      flow,
      prd: chatbot.prd,
      chatbot: {
        name: chatbot.name,
        description: chatbot.description,
        industry: chatbot.industry,
        tone: chatbot.tone,
      },
      userMessage: message,
      history,
    });

    await addMessage({
      conversationId: conversation.id,
      sender: 'bot',
      content: response.content,
      intent: response.intent,
      sentiment: response.sentiment,
    });

    res.json({
      conversationId: sessionId,
      response: response.content,
      intent: response.intent,
      sentiment: response.sentiment,
    });
  } catch (err) {
    console.error('Public chat error:', err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

/** Public transcript summary for embed (no message bodies). */
router.get('/conversations/:chatbotId', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.session_id, c.started_at,
              COUNT(m.id)::int AS message_count
       FROM conversations c
       LEFT JOIN messages m ON m.conversation_id = c.id
       WHERE c.chatbot_id = $1
       GROUP BY c.id
       ORDER BY c.started_at DESC
       LIMIT 100`,
      [req.params.chatbotId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

export default router;
