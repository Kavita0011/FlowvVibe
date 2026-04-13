import { Router } from 'express';
import { generateFlowWithAI, generateAIResponseWithRAG } from '../services/ai.js';

const router = Router();

router.post('/generate-flow', async (req, res) => {
  const { prd } = req.body;
  try {
    const flow = await generateFlowWithAI((prd || {}) as Record<string, unknown>);
    res.json(flow);
  } catch {
    res.status(500).json({ error: 'Failed to generate flow' });
  }
});

router.post('/chat', async (req, res) => {
  const { message, knowledgeBase, conversationHistory } = req.body;
  try {
    const response = await generateAIResponseWithRAG(
      message,
      Array.isArray(knowledgeBase) ? knowledgeBase : [],
      Array.isArray(conversationHistory) ? conversationHistory : []
    );
    res.json(response);
  } catch {
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

export default router;
