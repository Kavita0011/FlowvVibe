import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { Bot, Copy, Check, Code, Globe, ExternalLink, QrCode, Smartphone } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function EmbedCode() {
  const navigate = useNavigate();
  const { currentChatbot } = useChatbotStore();
  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState<'script' | 'iframe' | 'popup'>('script');

  const widgetCode = `<!-- FlowvVibe Chat Widget -->
<script>
(function() {
  window.flowvibeConfig = {
    chatbotId: '${currentChatbot?.id || 'YOUR_BOT_ID'}',
    apiUrl: '${API_URL}',
    position: 'bottom-right',
    primaryColor: '#06b6d4',
    title: '${currentChatbot?.name || 'FlowvVibe AI'}'
  };
  
  var script = document.createElement('script');
  script.src = '${API_URL}/widget.js';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`;

  const iframeCode = `<iframe 
  src="${API_URL}/widget/${currentChatbot?.id || 'bot_id'}"
  style="position:fixed;bottom:20px;right:20px;width:380px;height:520px;border:none;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15)"
  allow="microphone; camera"
></iframe>`;

  const popupCode = `<a href="${API_URL}/popup/${currentChatbot?.id || 'bot_id'}" target="_flowvibe" onclick="window.open(this.href,'flowvibe','width=400,height=600');return false">
  <button style="background:#06b6d4;color:white;padding:12px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:600">
    Chat with us
  </button>
</a>`;

  const handleCopy = () => {
    const code = embedType === 'script' ? widgetCode : embedType === 'iframe' ? iframeCode : popupCode;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testUrl = `${API_URL}/widget/${currentChatbot?.id || 'demo'}`;

  if (!currentChatbot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Bot className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Chatbot Selected</h2>
          <p className="text-slate-400 mb-6">Create or select a chatbot first</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-cyan-500 text-white rounded-xl">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Deploy Your Chatbot</h1>
        <p className="text-slate-400 mb-8">Embed the chat widget on your website</p>

        {/* Bot Info */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{currentChatbot.name}</h3>
            <p className="text-slate-400 text-sm">{currentChatbot.industry}</p>
          </div>
          <div className="ml-auto">
            <span className={`px-3 py-1 rounded-full text-sm ${currentChatbot.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {currentChatbot.published ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Embed Type Selection */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button onClick={() => setEmbedType('script')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${embedType === 'script' ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
            <Code className="w-6 h-6 text-cyan-400" />
            <span className="text-white font-medium">Script</span>
            <span className="text-slate-400 text-xs">Best for all sites</span>
          </button>
          <button onClick={() => setEmbedType('iframe')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${embedType === 'iframe' ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
            <Globe className="w-6 h-6 text-cyan-400" />
            <span className="text-white font-medium">Iframe</span>
            <span className="text-slate-400 text-xs">Easy embedding</span>
          </button>
          <button onClick={() => setEmbedType('popup')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${embedType === 'popup' ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
            <ExternalLink className="w-6 h-6 text-cyan-400" />
            <span className="text-white font-medium">Popup</span>
            <span className="text-slate-400 text-xs">Button link</span>
          </button>
        </div>

        {/* Code Block */}
        <div className="bg-slate-950 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Copy this code to your website</span>
            <button onClick={handleCopy} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap max-h-48">
            {embedType === 'script' ? widgetCode : embedType === 'iframe' ? iframeCode : popupCode}
          </pre>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <a href={testUrl} target="_blank" className="p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500 flex items-center gap-3">
            <Globe className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-white font-medium">Test Widget</h4>
              <p className="text-slate-400 text-xs">Open in new tab</p>
            </div>
          </a>
          <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-3">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-white font-medium">QR Code</h4>
              <p className="text-slate-400 text-xs">Scan to test</p>
            </div>
          </div>
        </div>

        {/* Mobile Preview */}
        <div className="mt-6 flex justify-center">
          <div className="w-64 h-96 bg-slate-800 rounded-2xl border-4 border-slate-700 overflow-hidden relative">
            <div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyan-500" />
                </div>
                <span className="text-white text-sm font-medium">{currentChatbot.name}</span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="bg-slate-700 rounded-lg p-2 max-w-[80%]">
                <p className="text-white text-xs">Hi! How can I help you today?</p>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-slate-700">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 text-xs">Type a message...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}