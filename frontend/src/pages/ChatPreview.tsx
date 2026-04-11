import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, Send, User, Loader2, MessageSquare, 
  Smile, Mehod, Frown, RefreshCw, Download, ExternalLink 
} from 'lucide-react';
import type { Node, Edge, Message } from '../types';

type Sender = 'user' | 'bot';

export default function ChatPreview() {
  const navigate = useNavigate();
  const { currentChatbot, prd } = useChatbotStore();
  const [messages, setMessages] = useState<Array<{ id: string; sender: Sender; content: string; timestamp: Date }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (prd?.companyName) {
      setMessages([
        {
          id: '1',
          sender: 'bot',
          content: `Hello! Welcome to ${prd.companyName}. How can I help you today?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [prd]);

  const findResponse = (userInput: string): string => {
    const flow = currentChatbot?.flow;
    if (!flow) return "I'm not sure how to respond to that. Can you try asking differently?";

    const lowerInput = userInput.toLowerCase();
    
    for (const faq of prd?.faq || []) {
      if (lowerInput.includes(faq.question.toLowerCase().split(' ')[0])) {
        return faq.answer;
      }
    }

    const services = prd?.services || [];
    for (const service of services) {
      if (lowerInput.includes(service.toLowerCase().split(' ')[0])) {
        return `Great question! We offer ${service}. Would you like me to help you with that?`;
      }
    }

    const templates = [
      { keywords: ['hello', 'hi', 'hey'], response: `Hi there! How can I assist you today?` },
      { keywords: ['help', 'support'], response: `I'd be happy to help! What do you need assistance with?` },
      { keywords: ['thank', 'thanks'], response: `You're welcome! Is there anything else I can help you with?` },
      { keywords: ['bye', 'goodbye'], response: `Thank you for chatting with us! Have a great day!` },
    ];

    for (const template of templates) {
      if (template.keywords.some(k => lowerInput.includes(k))) {
        return template.response;
      }
    }

    return "I understand. Let me connect you with the right information. What specific help do you need?";
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user' as Sender,
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'bot' as Sender,
        content: findResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setRating(null);
    if (prd?.companyName) {
      setMessages([
        {
          id: '1',
          sender: 'bot',
          content: `Hello! Welcome to ${prd.companyName}. How can I help you today?`,
          timestamp: new Date()
        }
      ]);
    }
  };

  const exportWidget = () => {
    const widgetCode = `<script>
  (function() {
    window.FlowVibeWidget = {
      botId: '${currentChatbot?.id}',
      position: 'bottom-right'
    };
    var s = document.createElement('script');
    s.src = 'https://cdn.flowvibe.ai/widget.js';
    document.head.appendChild(s);
  })();
</script>`;
    
    navigator.clipboard.writeText(widgetCode);
    alert('Widget code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <nav className="bg-slate-800 border-b border-slate-700 px-8 py-4 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/flow')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-bold text-white">Chat Preview</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button 
              onClick={exportWidget}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Widget
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex pt-20 pb-24">
        <div className="flex-1 flex justify-center items-center bg-slate-800/50">
          <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{prd?.companyName || 'AI Chatbot'}</h3>
                  <p className="text-cyan-100 text-sm">Online now</p>
                </div>
              </div>
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex gap-2",
                    msg.sender === 'user' ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.sender === 'user' ? "bg-cyan-500" : "bg-green-500"
                  )}>
                    {msg.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    msg.sender === 'user' 
                      ? "bg-cyan-500 text-white" 
                      : "bg-slate-700 text-white"
                  )}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-700 rounded-2xl px-4 py-2">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-700 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-full text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
                <button 
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="p-2 bg-cyan-500 hover:bg-cyan-400 rounded-full text-white transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 bg-slate-800 border-l border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Replies</h3>
          <div className="space-y-2">
            {(prd?.faq || []).slice(0, 5).map((faq, i) => (
              <button
                key={i}
                onClick={() => setInput(faq.question)}
                className="w-full text-left px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
              >
                {faq.question}
              </button>
            ))}
          </div>

          {rating === null && messages.length > 3 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Rate your experience</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="flex-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xl transition-colors"
                  >
                    {star} ★
                  </button>
                ))}
              </div>
            </div>
          )}

          {rating !== null && (
            <div className="mt-8 p-4 bg-green-500/20 rounded-lg">
              <p className="text-green-400 font-medium">Thanks for your feedback!</p>
              <p className="text-slate-400 text-sm mt-1">Rating: {rating}/5</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}