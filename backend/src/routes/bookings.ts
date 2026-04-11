import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface Booking {
  id: string;
  chatbotId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

const bookings = new Map<string, Booking>();

router.post('/', async (req, res) => {
  const { chatbotId, userId, customerName, customerEmail, customerPhone, service, date, time, notes } = req.body;
  const booking: Booking = {
    id: uuidv4(),
    chatbotId,
    userId,
    customerName,
    customerEmail,
    customerPhone,
    service,
    date,
    time,
    notes,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  bookings.set(booking.id, booking);
  res.json(booking);
});

router.get('/chatbot/:chatbotId', (req, res) => {
  const chatbotBookings = Array.from(bookings.values()).filter(b => b.chatbotId === req.params.chatbotId);
  res.json(chatbotBookings);
});

router.get('/user/:userId', (req, res) => {
  const userBookings = Array.from(bookings.values()).filter(b => b.userId === req.params.userId);
  res.json(userBookings);
});

router.put('/:id/status', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  booking.status = req.body.status;
  bookings.set(booking.id, booking);
  res.json(booking);
});

router.delete('/:id', (req, res) => {
  bookings.delete(req.params.id);
  res.json({ success: true });
});

export default router;