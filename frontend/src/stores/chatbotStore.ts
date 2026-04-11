import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Payment, Chatbot, PRD, FlowData, FlowNode, FlowEdge, Conversation, Message } from '../types';

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
  
  login: (email: string, password: string) => Promise<boolean>;
  loginWithAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  
  setUser: (user: User | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  
  setChatbots: (chatbots: Chatbot[]) => void;
  setCurrentChatbot: (chatbot: Chatbot | null) => void;
  
  setPRD: (prd: PRD | null) => void;
  updatePRD: (updates: Partial<PRD>) => void;
  
  setFlowData: (flow: FlowData) => void;
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: FlowEdge) => void;
  removeEdge: (id: string) => void;
  
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  
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
  { id: 'bot_001', userId: 'user_001', name: 'Customer Support Bot', industry: 'E-commerce', tone: 'friendly', flow: { nodes: [], edges: [] }, published: true, channels: [], createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-15') }
];

export const useChatbotStore = create<ChatbotState>()(
  persist(
    (set) => ({
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
      
      setChatbots: (chatbots) => set({ chatbots }),
      setCurrentChatbot: (chatbot) => set({ currentChatbot: chatbot }),
      deleteChatbot: (id) => set(state => ({ 
        chatbots: state.chatbots.filter(c => c.id !== id),
        currentChatbot: state.currentChatbot?.id === id ? null : state.currentChatbot
      })),
      
      setPRD: (prd) => set({ prd }),
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