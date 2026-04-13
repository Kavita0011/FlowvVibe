import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, Send, User, Loader2, 
  RefreshCw, Download, Mic, MicOff, Volume2, VolumeX, Phone, Video, Smile, Paperclip
} from 'lucide-react';
import type { Message } from '../types';

type Sender = 'user' | 'bot';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ChatPreview() {
  const navigate = useNavigate();
  const { currentChatbot, prd } = useChatbotStore();
  const [messages, setMessages] = useState<Array<{ id: string; sender: Sender; content: string; timestamp: Date }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = typeof window !== 'undefined' ? window.speechSynthesis : null;

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

  /** Offline / demo fallback when API is unreachable (mirrors weaker path; backend is authoritative). */
  const findResponseLocal = (userInput: string): string => {
    const flow = currentChatbot?.flow;
    const company = prd?.companyName || currentChatbot?.name || 'us';
    const lowerInput = userInput.toLowerCase().normalize('NFKC');

    const overlap = (a: string, b: string) => {
      const btoks = b.split(/\s+/).filter((t) => t.length > 2);
      return btoks.reduce((n, t) => n + (a.includes(t) ? 1 : 0), 0);
    };

    let bestFaq: { a: string; s: number } | null = null;
    for (const faq of prd?.faq || []) {
      const q = faq.question.toLowerCase();
      const s = overlap(lowerInput, q) * 2 + (lowerInput.includes(q.slice(0, Math.min(24, q.length))) ? 3 : 0);
      if (!bestFaq || s > bestFaq.s) bestFaq = { a: faq.answer, s };
    }
    if (bestFaq && bestFaq.s >= 2) return bestFaq.a;

    for (const node of flow?.nodes || []) {
      if (node.type !== 'aiResponse') continue;
      const msg = String((node.data as { message?: string })?.message || '');
      const intent = String((node.data as { intent?: string })?.intent || '');
      const blob = `${msg} ${(node.data as { label?: string })?.label || ''}`.toLowerCase();
      if (intent && lowerInput.includes(intent)) return msg || `Thanks for your message — how else can ${company} help?`;
      if (overlap(lowerInput, blob) >= 2 && msg) return msg;
    }

    for (const service of prd?.services || []) {
      if (overlap(lowerInput, service.toLowerCase()) >= 1) {
        return `We offer ${service}. Would you like more detail or help choosing the right option?`;
      }
    }

    const templates: { keys: string[]; r: string }[] = [
      { keys: ['hello', 'hi', 'hey', 'good morning'], r: `Hi — what can ${company} help you with today?` },
      { keys: ['help', 'support', 'issue'], r: `I'll help. What exactly is going wrong (or what’s your goal)?` },
      { keys: ['price', 'cost', 'pricing'], r: `I can explain pricing. What plan or use case are you considering?` },
      { keys: ['thank', 'thanks'], r: `You're welcome! Anything else I can clear up?` },
      { keys: ['bye', 'goodbye'], r: `Thanks for chatting — have a great day!` },
    ];
    for (const t of templates) {
      if (t.keys.some((k) => lowerInput.includes(k))) return t.r;
    }

    return `I want to get you the right answer. Could you share a bit more about what you need from ${company}?`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user' as Sender,
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const botId = currentChatbot?.id;
    const storageKey = botId ? `fv_preview_sess_${botId}` : '';

    try {
      if (botId) {
        const sid = storageKey ? sessionStorage.getItem(storageKey) || '' : '';
        const res = await fetch(`${API_URL}/api/chat/${botId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            context: { sessionId: sid || undefined }
          })
        });
        if (res.ok) {
          const data = (await res.json()) as { conversationId?: string; response?: string };
          if (data.conversationId && storageKey) {
            sessionStorage.setItem(storageKey, data.conversationId);
          }
          const reply = data.response?.trim() || findResponseLocal(text);
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              sender: 'bot' as Sender,
              content: reply,
              timestamp: new Date()
            }
          ]);
          setLoading(false);
          return;
        }
      }
    } catch {
      /* use local fallback */
    }

    const botResponse = {
      id: (Date.now() + 1).toString(),
      sender: 'bot' as Sender,
      content: findResponseLocal(text),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botResponse]);
    setLoading(false);
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

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };
        
        recognitionRef.current.onerror = () => {
          setIsListening(false);
          toast.error('Voice recognition failed');
        };
        
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        toast.error('Voice recognition not supported in this browser');
      }
    }
  };

  const speakMessage = (text: string) => {
    if (!speechSynthesisRef) return;
    
    if (speechSynthesisRef.speaking) {
      speechSynthesisRef.cancel();
      setIsSpeaking(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesisRef.speak(utterance);
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
    toast.success('Widget code copied to clipboard!');
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
                    {msg.sender === 'bot' && voiceEnabled && (
                      <button 
                        onClick={() => speakMessage(msg.content)}
                        className="mt-1 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        {isSpeaking ? 'Stop' : 'Listen'}
                      </button>
                    )}
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
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-full transition-colors ${voiceEnabled ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                  title="Toggle voice features"
                >
                  {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-full text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
                {voiceEnabled && (
                  <button 
                    onClick={toggleVoiceInput}
                    className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                    title="Voice input"
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
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