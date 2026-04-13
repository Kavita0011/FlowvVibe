import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Payment, Chatbot, PRD, FlowData, FlowNode, FlowEdge, Conversation, Message, BotTheme, BotSettings } from '../types';

interface ChatbotState {
  user: User | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  users: User[];
  payments: Payment[];
  chatbots: Chatbot[];
  currentChatbot: Chatbot | null;
  prd: PRD | null;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  
  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  loginWithAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  
  // User management
  setUser: (user: User | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Payment management
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  
  // Chatbot management with proper access controls
  setChatbots: (chatbots: Chatbot[]) => void;
  setCurrentChatbot: (chatbot: Chatbot | null) => void;
  createChatbot: (botData: Partial<Chatbot>) => Chatbot | null;
  updateChatbot: (id: string, updates: Partial<Chatbot>) => boolean;
  deleteChatbot: (id: string) => boolean;
  saveDraft: (id: string) => boolean;
  publishBot: (id: string) => boolean;
  activateBot: (id: string) => boolean;
  deactivateBot: (id: string) => boolean;
  canEditBot: (botId: string) => boolean;
  canDeleteBot: (botId: string) => boolean;
  getUserBots: () => Chatbot[];
  getAllBots: () => Chatbot[];
  
  // PRD management
  setPRD: (prd: PRD | null) => void;
  clearPRD: () => void;
  updatePRD: (updates: Partial<PRD>) => void;
  
  // Flow management
  setFlowData: (flow: FlowData) => void;
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: FlowEdge) => void;
  removeEdge: (id: string) => void;
  
  // Theme and settings
  updateBotTheme: (botId: string, theme: Partial<BotTheme>) => boolean;
  updateBotSettings: (botId: string, settings: Partial<BotSettings>) => boolean;
  
  // Conversations
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  
  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Demo data
const DEMO_USERS: User[] = [
  { id: 'user_001', email: 'demo@flowvibe.ai', displayName: 'Demo User', role: 'user', isActive: true, createdAt: new Date('2024-01-01'), subscription: { tier: 'pro', status: 'active', expiresAt: new Date('2025-01-01'), startDate: new Date('2024-01-01') }, companyName: 'Demo Company', location: 'Mumbai' }
];

const DEMO_PAYMENTS: Payment[] = [
  { id: 'pay_001', userId: 'user_001', amount: 499, currency: 'INR', status: 'completed', method: 'upi', plan: 'pro', createdAt: new Date('2024-01-01'), transactionId: 'TXN001' },
  { id: 'pay_002', userId: 'user_001', amount: 499, currency: 'INR', status: 'completed', method: 'card', plan: 'pro', createdAt: new Date('2025-01-01'), transactionId: 'TXN002' }
];

const DEMO_CHATBOTS: Chatbot[] = [
  { 
    id: 'bot_001', 
    userId: 'user_001', 
    name: 'Customer Support Bot', 
    industry: 'E-commerce', 
    tone: 'friendly', 
    flow: { nodes: [], edges: [] }, 
    published: true, 
    status: 'active',
    channels: [], 
    createdAt: new Date('2024-01-01'), 
    updatedAt: new Date('2024-01-15') 
  }
];

export const useChatbotStore = create<ChatbotState>()(
  persist(
    (set, get): ChatbotState => ({
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      users: [],
      payments: [],
      chatbots: [],
      currentChatbot: null,
      prd: null,
      conversations: [],
      currentConversation: null,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        if (email === 'devappkavita@gmail.com' && password === 'kavitabisht2598@sbi') {
          const adminUser: User = { id: 'admin_001', email: 'devappkavita@gmail.com', displayName: 'Admin', role: 'admin', isActive: true, createdAt: new Date() };
          set({ user: adminUser, isAdmin: true, isAuthenticated: true, isLoading: false, users: DEMO_USERS, payments: DEMO_PAYMENTS });
          return true;
        }
        
        const demoUser = DEMO_USERS.find(u => u.email === email);
        if (demoUser) {
          set({ user: demoUser, isAdmin: false, isAuthenticated: true, isLoading: false, chatbots: DEMO_CHATBOTS });
          return true;
        }
        
        set({ error: 'Invalid credentials', isLoading: false });
        return false;
      },
      
      loginWithAdmin: async () => false,
      
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, isAdmin: false, isAuthenticated: false, currentChatbot: null, chatbots: [] });
      },
      
      register: async (email, password, displayName) => {
        const newUser: User = { id: `user_${Date.now()}`, email, displayName, role: 'user', isActive: true, createdAt: new Date(), subscription: { tier: 'free', status: 'active', expiresAt: new Date(Date.now() + 30*24*60*60*1000) } };
        set(state => ({ users: [...state.users, newUser], user: newUser, isAuthenticated: true, isLoading: false }));
        return true;
      },
      
      setUser: (user) => set({ user, isAdmin: user?.role === 'admin' }),
  setIsAuthenticated: (auth: boolean) => set({ isAuthenticated: auth }),
      setUsers: (users) => set({ users }),
      addUser: (user) => set(state => ({ users: [...state.users, user] })),
      updateUser: (id, updates) => set(state => ({ users: state.users.map(u => u.id === id ? { ...u, ...updates } : u) })),
      deleteUser: (id) => set(state => ({ users: state.users.map(u => u.id === id ? { ...u, isActive: false } : u) })),
      
      setPayments: (payments) => set({ payments }),
      addPayment: (payment) => set(state => ({ payments: [...state.payments, payment] })),
      updatePayment: (id, updates) => set(state => ({ payments: state.payments.map(p => p.id === id ? { ...p, ...updates } : p) })),
      
      // Chatbot management with access controls
      setChatbots: (chatbots) => set({ chatbots }),
      setCurrentChatbot: (chatbot) => set({ currentChatbot: chatbot }),
      
      createChatbot: (botData) => {
        const state = get();
        if (!state.user) return null;
        
        const newBot: Chatbot = {
          id: `bot_${Date.now()}`,
          userId: state.user.id,
          name: botData.name || 'New Bot',
          description: botData.description || '',
          industry: botData.industry || 'General',
          targetAudience: botData.targetAudience || '',
          tone: botData.tone || 'friendly',
          flow: botData.flow || { nodes: [], edges: [] },
          published: false,
          status: 'draft',
          channels: botData.channels || [],
          createdAt: new Date(),
          updatedAt: new Date(),
          theme: botData.theme || {
            primaryColor: '#06b6d4',
            secondaryColor: '#0891b2',
            backgroundColor: '#f8fafc',
            textColor: '#1e293b',
            fontFamily: 'Inter',
            borderRadius: 'medium'
          },
          settings: botData.settings || {
            welcomeMessage: 'Hello! How can I help you today?',
            fallbackMessage: "I'm sorry, I didn't understand that. Could you please rephrase?",
            typingIndicator: true,
            soundEnabled: false,
            fileAttachments: false,
            maxFileSize: 5,
            allowedFileTypes: ['.jpg', '.png', '.pdf'],
            businessHoursOnly: false,
            autoCloseTimeout: 30,
            requireEmail: false,
            requirePhone: false
          }
        };
        
        set(state => ({ chatbots: [...state.chatbots, newBot] }));
        return newBot;
      },
      
      updateChatbot: (id, updates) => {
        const state = useChatbotStore.getState();
        const bot = state.chatbots.find(c => c.id === id);
        if (!bot) return false;
        if (!state.canEditBot(id)) return false;
        
        set(state => ({
          chatbots: state.chatbots.map(c => 
            c.id === id 
              ? { ...c, ...updates, updatedAt: new Date(), lastModifiedAt: new Date() } 
              : c
          ),
          currentChatbot: state.currentChatbot?.id === id 
            ? { ...state.currentChatbot, ...updates, updatedAt: new Date(), lastModifiedAt: new Date() }
            : state.currentChatbot
        }));
        return true;
      },
      
      deleteChatbot: (id) => {
        const state = useChatbotStore.getState();
        if (!state.canDeleteBot(id)) return false;
        
        set(state => ({
          chatbots: state.chatbots.filter(c => c.id !== id),
          currentChatbot: state.currentChatbot?.id === id ? null : state.currentChatbot
        }));
        return true;
      },
      
      saveDraft: (id) => {
        return useChatbotStore.getState().updateChatbot(id, { 
          status: 'draft', 
          published: false,
          lastModifiedAt: new Date()
        });
      },
      
      publishBot: (id) => {
        return useChatbotStore.getState().updateChatbot(id, { 
          status: 'active', 
          published: true,
          updatedAt: new Date()
        });
      },
      
      activateBot: (id) => {
        return useChatbotStore.getState().updateChatbot(id, { 
          status: 'active',
          updatedAt: new Date()
        });
      },
      
      deactivateBot: (id) => {
        return useChatbotStore.getState().updateChatbot(id, { 
          status: 'inactive',
          updatedAt: new Date()
        });
      },
      
      canEditBot: (botId) => {
        const state = useChatbotStore.getState();
        if (!state.user) return false;
        if (state.isAdmin) return true;
        const bot = state.chatbots.find(c => c.id === botId);
        return bot ? bot.userId === state.user.id : false;
      },
      
      canDeleteBot: (botId) => {
        const state = useChatbotStore.getState();
        if (!state.user) return false;
        if (state.isAdmin) return true;
        const bot = state.chatbots.find(c => c.id === botId);
        return bot ? bot.userId === state.user.id : false;
      },
      
      getUserBots: () => {
        const state = useChatbotStore.getState();
        if (!state.user) return [];
        if (state.isAdmin) return state.chatbots;
        return state.chatbots.filter(c => c.userId === state.user!.id);
      },
      
      getAllBots: () => {
        const state = useChatbotStore.getState();
        return state.chatbots;
      },
      
      updateBotTheme: (botId, theme) => {
        const state = useChatbotStore.getState();
        const bot = state.chatbots.find(c => c.id === botId);
        if (!bot || !state.canEditBot(botId)) return false;
        
        return state.updateChatbot(botId, {
          theme: { ...bot.theme, ...theme }
        });
      },
      
      updateBotSettings: (botId, settings) => {
        const state = useChatbotStore.getState();
        const bot = state.chatbots.find(c => c.id === botId);
        if (!bot || !state.canEditBot(botId)) return false;
        
        return state.updateChatbot(botId, {
          settings: { ...bot.settings, ...settings }
        });
      },
      
      setPRD: (prd) => set({ prd }),
      clearPRD: () => set({ prd: null }),
      updatePRD: (updates) => set(state => ({ prd: state.prd ? { ...state.prd, ...updates } : null })),
      
      setFlowData: (flow) => set(state => ({ currentChatbot: state.currentChatbot ? { ...state.currentChatbot, flow } : null })),
      addNode: (node) => set(state => {
        if (!state.currentChatbot) return state;
        return { currentChatbot: { ...state.currentChatbot, flow: { ...state.currentChatbot.flow, nodes: [...state.currentChatbot.flow.nodes, node] } } };
      }),
      updateNode: (id, updates) => set(state => {
        if (!state.currentChatbot) return state;
        return { currentChatbot: { ...state.currentChatbot, flow: { ...state.currentChatbot.flow, nodes: state.currentChatbot.flow.nodes.map(n => n.id === id ? { ...n, ...updates } : n) } } };
      }),
      removeNode: (id) => set(state => {
        if (!state.currentChatbot) return state;
        return { currentChatbot: { ...state.currentChatbot, flow: { ...state.currentChatbot.flow, nodes: state.currentChatbot.flow.nodes.filter(n => n.id !== id) } } };
      }),
      addEdge: (edge) => set(state => {
        if (!state.currentChatbot) return state;
        return { currentChatbot: { ...state.currentChatbot, flow: { ...state.currentChatbot.flow, edges: [...state.currentChatbot.flow.edges, edge] } } };
      }),
      removeEdge: (id) => set(state => {
        if (!state.currentChatbot) return state;
        return { currentChatbot: { ...state.currentChatbot, flow: { ...state.currentChatbot.flow, edges: state.currentChatbot.flow.edges.filter(e => e.id !== id) } } };
      }),
      
      setConversations: (conversations) => set({ conversations }),
      setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
      addMessage: (message) => set(state => {
        if (!state.currentConversation) return state;
        return { currentConversation: { ...state.currentConversation, messages: [...state.currentConversation.messages, message] } };
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      reset: () => set({ user: null, isAdmin: false, isAuthenticated: false, isLoading: false, error: null, chatbots: [], currentChatbot: null, prd: null })
    }),
    { name: 'flowvibe-storage', partialize: (state) => ({ user: state.user, isAdmin: state.isAdmin, isAuthenticated: state.isAuthenticated }) }
  )
);