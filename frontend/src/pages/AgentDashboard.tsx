import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../stores/chatbotStore';
import { cn } from '../utils/cn';
import { 
  Bot, ArrowLeft, MessageSquare, Users, Send, Search, 
  MoreVertical, Phone, Mail, Clock, CheckCircle, AlertCircle,
  User as UserIcon, LogOut
} from 'lucide-react';

type ChatStatus = 'waiting' | 'active' | 'resolved';

interface ActiveChat {
  id: string;
  customer: string;
  lastMessage: string;
  time: string;
  status: ChatStatus;
  messages: Array<{ sender: string; content: string; time: Date }>;
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user } = useChatbotStore();
  const [selectedChat, setSelectedChat] = useState<ActiveChat | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [chats] = useState<ActiveChat[]>([
    {
      id: '1',
      customer: 'Rahul Sharma',
      lastMessage: 'I need help with my order',
      time: '2 min ago',
      status: 'waiting',
      messages: [
        { sender: 'user', content: 'Hi, I need help with my order', time: new Date() }
      ]
    },
    {
      id: '2',
      customer: 'Priya Patel',
      lastMessage: 'When will it deliver?',
      time: '5 min ago',
      status: 'active',
      messages: [
        { sender: 'user', content: 'When will my package arrive?', time: new Date() }
      ]
    },
    {
      id: '3',
      customer: 'Amit Kumar',
      lastMessage: 'Thank you!',
      time: '10 min ago',
      status: 'resolved',
      messages: [
        { sender: 'user', content: 'I want to return this item', time: new Date() }
      ]
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;
    
    setSelectedChat({
      ...selectedChat,
      messages: [...selectedChat.messages, { sender: 'agent', content: message, time: new Date() }]
    });
    setMessage('');
  };

  const filteredChats = chats.filter(c => 
    c.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <nav className="bg-slate-800 border-b border-slate-700 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-bold text-white">Agent Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-slate-400">Online</span>
            </div>
            <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex">
        <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors",
                  selectedChat?.id === chat.id && "bg-slate-700"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-medium">{chat.customer}</h3>
                  <span className="text-slate-500 text-xs">{chat.time}</span>
                </div>
                <p className="text-slate-400 text-sm truncate">{chat.lastMessage}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    chat.status === 'waiting' && "bg-yellow-500/20 text-yellow-400",
                    chat.status === 'active' && "bg-green-500/20 text-green-400",
                    chat.status === 'resolved' && "bg-slate-500/20 text-slate-400"
                  )}>
                    {chat.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedChat.customer}</h2>
                    <p className="text-slate-400 text-sm">Customer since Jan 2024</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <Mail className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedChat.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2",
                      msg.sender === 'agent' && "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2",
                      msg.sender === 'agent'
                        ? "bg-cyan-500 text-white"
                        : "bg-slate-700 text-white"
                    )}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800 border-t border-slate-700 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No chat selected</h2>
                <p className="text-slate-400">Select a chat from the list to start responding</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-72 bg-slate-800 border-l border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Customer Info</h3>
          
          {selectedChat ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-700 rounded-lg">
                <p className="text-slate-400 text-xs mb-1">Name</p>
                <p className="text-white">{selectedChat.customer}</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <p className="text-slate-400 text-xs mb-1">Email</p>
                <p className="text-white">customer@email.com</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <p className="text-slate-400 text-xs mb-1">Phone</p>
                <p className="text-white">+91 98765 43210</p>
              </div>
              <div className="p-4 bg-slate-700 rounded-lg">
                <p className="text-slate-400 text-xs mb-1">Chat Status</p>
                <p className={cn(
                  "font-medium",
                  selectedChat.status === 'waiting' && "text-yellow-400",
                  selectedChat.status === 'active' && "text-green-400",
                  selectedChat.status === 'resolved' && "text-slate-400"
                )}>
                  {selectedChat.status.charAt(0).toUpperCase() + selectedChat.status.slice(1)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a chat to view customer details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}