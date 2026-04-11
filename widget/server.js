import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3002;
const API_URL = process.env.API_URL || 'http://localhost:3001';

app.use(cors());
app.use(express.json());

// Chat widget endpoint
app.post('/api/chat', async (req, res) => {
  const { chatbotId, message, sessionId, context } = req.body;
  
  try {
    const response = await fetch(`${API_URL}/api/chat/${chatbotId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, context })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Chat failed' });
  }
});

// Get widget HTML
app.get('/widget/:chatbotId', (req, res) => {
  const { chatbotId } = req.params;
  const color = req.query.color || '#06b6d4';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; height: 100vh; display: flex; flex-direction: column; }
    .header { background: linear-gradient(135deg, ${color}, #8b5cf6); padding: 16px; display: flex; align-items: center; gap: 12px; }
    .avatar { width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .title { color: white; font-weight: 600; }
    .messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .message { max-width: 80%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; }
    .bot { background: #1e293b; color: white; align-self: flex-start; border-bottom-left-radius: 4px; }
    .user { background: ${color}; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .input-area { padding: 16px; background: #1e293b; display: flex; gap: 12px; }
    .input { flex: 1; padding: 12px 16px; border: none; border-radius: 24px; background: #334155; color: white; font-size: 14px; outline: none; }
    .input::placeholder { color: #94a3b8; }
    .send { width: 44px; height: 44px; border-radius: 50%; background: ${color}; border: none; color: white; cursor: pointer; font-size: 18px; }
    .send:disabled { opacity: 0.5; }
    .typing { padding: 12px 16px; background: #1e293b; border-radius: 16px; color: #94a3b8; font-size: 14px; display: none; }
    .typing.show { display: block; }
  </style>
</head>
<body>
  <div class="header">
    <div class="avatar">🤖</div>
    <div class="title">AI Assistant</div>
  </div>
  <div class="messages" id="messages">
    <div class="message bot">Hello! 👋 How can I help you today?</div>
  </div>
  <div class="typing" id="typing">Typing...</div>
  <div class="input-area">
    <input class="input" id="input" placeholder="Type a message..." autofocus>
    <button class="send" id="send">➤</button>
  </div>
  <script>
    const widgetApiUrl = '${API_URL}';
    const chatbotId = '${chatbotId}';
    let sessionId = localStorage.getItem('session') || Math.random().toString(36);
    localStorage.setItem('session', sessionId);
    
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const send = document.getElementById('send');
    const typing = document.getElementById('typing');
    
    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      
      addMessage(text, 'user');
      input.value = '';
      send.disabled = true;
      typing.classList.add('show');
      
      try {
        const res = await fetch(widgetApiUrl + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatbotId, message: text, sessionId })
        });
        const data = await res.json();
        typing.classList.remove('show');
        addMessage(data.response || 'Thanks for messaging!', 'bot');
      } catch (e) {
        typing.classList.remove('show');
        addMessage('Sorry, something went wrong.', 'bot');
      }
      send.disabled = false;
      input.focus();
    }
    
    function addMessage(text, sender) {
      const div = document.createElement('div');
      div.className = 'message ' + sender;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }
    
    send.addEventListener('click', sendMessage);
    input.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
  </script>
</body>
</html>
  `;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`FlowvVibe Widget running on port ${PORT}`);
});