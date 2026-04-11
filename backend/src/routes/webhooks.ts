import { Router } from 'express';

const router = Router();

router.post('/zapier', async (req, res) => {
  const { zapierHookUrl, action, data } = req.body;
  if (!zapierHookUrl) return res.status(400).json({ error: 'Zapier webhook URL required' });
  try {
    const response = await fetch(zapierHookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...data })
    });
    const result = await response.json();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger Zapier webhook' });
  }
});

router.post('/custom', async (req, res) => {
  const { webhookUrl, method = 'POST', headers = {}, body } = req.body;
  if (!webhookUrl) return res.status(400).json({ error: 'Webhook URL required' });
  try {
    const response = await fetch(webhookUrl, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to call webhook' });
  }
});

export default router;