import { Router } from 'express';

const router = Router();

// WhatsApp Cloud API Integration
router.post('/webhook', async (req, res) => {
  const { object } = req.body;
  
  if (!object || !object.entries) {
    return res.json({ success: true });
  }
  
  for (const entry of object.entries) {
    for (const change of entry.changes) {
      const messages = change.value?.messages;
      if (messages) {
        for (const message of messages) {
          const from = message.from;
          const text = message.text?.body;
          const type = message.type;
          
          console.log(`WhatsApp message from ${from}: ${text}`);
          
          if (text) {
            const response = await generateResponse(text);
            await sendWhatsAppMessage(from, response);
          }
        }
      }
    }
  }
  
  res.json({ success: true });
});

router.post('/send', async (req, res) => {
  const { to, message, template, components } = req.body;
  
  const WhatsAppToken = process.env.WHATSAPP_TOKEN;
  const PhoneNumberId = process.env.WHATSAPP_PHONE_ID;
  const Version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  
  if (!WhatsAppToken || !PhoneNumberId) {
    return res.status(500).json({ error: 'WhatsApp not configured' });
  }
  
  try {
    const response = await fetch(`https://graph.facebook.com/${Version}/${PhoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WhatsAppToken}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: template ? 'template' : 'text',
        ...(template 
          ? { template: { name: template, components } }
          : { text: { body: message } }
        )
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});

router.get('/config', (req, res) => {
  const configured = !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
  res.json({
    configured,
    phoneNumberId: process.env.WHATSAPP_PHONE_ID ? 'configured' : 'not set'
  });
});

async function generateResponse(text: string): Promise<string> {
  const responses: Record<string, string> = {
    'hi': 'Hello! 👋 How can I help you today?',
    'hello': 'Hey there! 👋 What can I help you with?',
    'help': "I'm here to help! You can ask me about:\n• Our services\n• Pricing\n• Booking an appointment",
    'pricing': 'Our pricing starts at just ₹499/month. Would you like me to send you more details?',
    'book': 'I can help you book an appointment! What service are you interested in?',
    'contact': "I'll connect you with our team. They should reach out within 24 hours.",
    'default': 'Thanks for your message! Our team will get back to you shortly. 😊'
  };
  
  const lower = text.toLowerCase();
  for (const [key, response] of Object.entries(responses)) {
    if (lower.includes(key)) return response;
  }
  return responses.default;
}

async function sendWhatsAppMessage(to: string, message: string) {
  const WhatsAppToken = process.env.WHATSAPP_TOKEN;
  const PhoneNumberId = process.env.WHATSAPP_PHONE_ID;
  const Version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  
  if (!WhatsAppToken || !PhoneNumberId) return;
  
  await fetch(`https://graph.facebook.com/${Version}/${PhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WhatsAppToken}`
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message }
    })
  });
}

export default router;