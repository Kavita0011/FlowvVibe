import { Router } from 'express';

const router = Router();

router.post('/send', async (req, res) => {
  const { to, subject, body, from, smtpConfig } = req.body;
  if (!to || !subject || !body) return res.status(400).json({ error: 'Missing required fields' });
  
  const smtp = smtpConfig || {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  };
  
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth ? { user: smtp.auth.user, pass: smtp.auth.pass } : undefined
    });
    
    await transporter.sendMail({
      from: from || smtp.auth?.user,
      to,
      subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

router.post('/template', async (req, res) => {
  const { to, template, data } = req.body;
  const templates: Record<string, string> = {
    booking_confirm: `Your booking is confirmed for {{date}} at {{time}}. Thank you!`,
    booking_reminder: `Reminder: Your booking is tomorrow at {{time}}.`,
    lead_followup: `Thank you for your interest! We'll be in touch soon.`,
    welcome: `Welcome to {{company}}! How can we help you?`
  };
  
  let body = templates[template] || templates.welcome;
  Object.entries(data || {}).forEach(([key, value]) => {
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), value as string);
  });
  
  res.json({ body });
});

export default router;