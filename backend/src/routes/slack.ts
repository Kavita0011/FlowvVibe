import { Router } from 'express';

const router = Router();

// Slack Integration Routes
router.post('/slack/events', async (req, res) => {
  const { type, challenge, event } = req.body;
  
  // URL verification for Slack
  if (type === 'url_verification') {
    return res.json({ challenge });
  }
  
  // Handle message events
  if (event?.type === 'message' && event.channel_type === 'channel') {
    const { text, user, channel, ts } = event;
    console.log(`Slack message from ${user}: ${text}`);
    
    // Process with bot and send response
    const response = await processWithBot(text);
    
    // Post back to Slack (requires webhook or bot token)
    if (process.env.SLACK_BOT_TOKEN) {
      await postSlackMessage(channel, response);
    }
  }
  
  res.json({ ok: true });
});

router.post('/slack/interactive', async (req, res) => {
  const { payload } = req.body;
  const payloadData = JSON.parse(payload);
  const { actions, user, response_url } = payloadData;
  
  console.log(`Slack interaction: ${actions[0]?.action_id} from ${user.id}`);
  
  res.json({ ok: true });
});

router.post('/notify', async (req, res) => {
  const { channel, message, blocks } = req.body;
  
  if (!process.env.SLACK_BOT_TOKEN) {
    return res.status(500).json({ error: 'Slack not configured' });
  }
  
  try {
    const result = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
      },
      body: JSON.stringify({
        channel,
        text: message,
        blocks
      })
    });
    
    const data = await result.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send Slack message' });
  }
});

async function processWithBot(text: string): Promise<string> {
  // Simple response generator - integrate with your AI
  const responses: Record<string, string> = {
    'hi': 'Hello! How can I help you today?',
    'help': 'I can assist you with our services, pricing, and more.',
    'pricing': 'Our plans start at ₹499/month. Check our pricing page for details.',
    'default': 'Thanks for reaching out! Our team will get back to you soon.'
  };
  
  const lower = text.toLowerCase();
  for (const [key, response] of Object.entries(responses)) {
    if (lower.includes(key)) return response;
  }
  return responses.default;
}

async function postSlackMessage(channel: string, text: string) {
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
    },
    body: JSON.stringify({ channel, text })
  });
}

export default router;