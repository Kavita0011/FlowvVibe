import express from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bookingsRouter from './routes/bookings.js';
import webhooksRouter from './routes/webhooks.js';
import emailRouter from './routes/email.js';
import handoffRouter from './routes/handoff.js';
import callRouter from './routes/call.js';
import authRouter from './routes/auth.js';
import apiRouter from './routes/api.js';
import slackRouter from './routes/slack.js';
import whatsappRouter from './routes/whatsapp.js';
import publicChatRouter from './routes/publicChat.js';
import aiRoutes from './routes/aiRoutes.js';
import psadminRouter from './routes/psadmin.js';
import { initPricingTables } from './db/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  'https://flowvibe.kavitabishtofficial1.workers.dev',
  'https://flowvibe.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (ALLOWED_ORIGINS.some((o) => origin.includes(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
app.use(compression());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

void initPricingTables().catch((err) => console.error('initPricingTables:', err));

app.use('/api/bookings', bookingsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/email', emailRouter);
app.use('/api/handoff', handoffRouter);
app.use('/api/call', callRouter);
app.use('/api/auth', authRouter);

app.use('/api', publicChatRouter);
app.use('/api/ai', aiRoutes);
app.use('/api/psadmin', psadminRouter);

app.use('/api', apiRouter);
app.use('/api/slack', slackRouter);
app.use('/api/whatsapp', whatsappRouter);

app.listen(PORT, () => {
  console.log(`FlowvVibe API running on port ${PORT}`);
});

export default app;
