import { Router } from 'express';

const router = Router();

router.post('/initiate', async (req, res) => {
  const { toNumber, fromNumber, twilioConfig, message } = req.body;
  const config = twilioConfig || {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER
  };
  
  if (!config.accountSid || !config.authToken) {
    return res.status(400).json({ error: 'Twilio credentials not configured' });
  }
  
  try {
    const client = await import('twilio');
    const twilio = client.default(config.accountSid, config.authToken);
    
    const call = await twilio.calls.create({
      to: toNumber,
      from: fromNumber || config.fromNumber,
      twiml: `<Response><Say>${message || 'Hello. You have a call from FlowvVibe chatbot.'}</Say></Response>`,
      url: process.env.TWILIO_TWIML_URL
    });
    
    res.json({ sid: call.sid, status: call.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

router.post('/forward', async (req, res) => {
  const { callSid, toNumber, twilioConfig } = req.body;
  const config = twilioConfig || {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN
  };
  
  try {
    const client = await import('twilio');
    const twilio = client.default(config.accountSid, config.authToken);
    
    const call = await twilio.calls(callSid).update({
      twiml: `<Response><Dial>${toNumber}</Dial></Response>`
    });
    
    res.json({ sid: call.sid, status: call.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to forward call' });
  }
});

export default router;