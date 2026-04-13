import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Payment, Chatbot, PRD, FlowData, FlowNode, FlowEdge, Conversation, Message, BotTheme, BotSettings } from '../types';
import {
  supabase,
  isSupabaseConfigured,
  fetchChatbots,
  createChatbot as createChatbotInDB,
  updateChatbot as updateChatbotInDB,
  deleteChatbot as deleteChatbotInDB,
  signInWithPassword,
  signUp,
  signOut,
  getCurrentUser,
  getSession,
  subscribeToChatbots
} from '../lib/supabase';
import type { Database } from '../types/supabase';
import { 
  validateEmail, 
  validatePassword, 
  validateBotName, 
  validateIndustry,
  validateDescription,
  sanitizeInput,
  validateForm,
  globalRateLimiter,
  type ValidationResult 
} from '../utils/validation';

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
  createChatbot: (botData: Partial<Chatbot>) => Promise<Chatbot | null>;
  updateChatbot: (id: string, updates: Partial<Chatbot>) => Promise<boolean>;
  deleteChatbot: (id: string) => Promise<boolean>;
  saveDraft: (id: string) => Promise<boolean>;
  publishBot: (id: string) => Promise<boolean>;
  activateBot: (id: string) => Promise<boolean>;
  deactivateBot: (id: string) => Promise<boolean>;
  canEditBot: (botId: string) => boolean;
  canDeleteBot: (botId: string) => boolean;
  getUserBots: () => Chatbot[];
  getAllBots: () => Chatbot[];
  
  // Supabase integration
  loadChatbots: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  isUsingRealBackend: () => boolean;
  
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
  updateBotTheme: (botId: string, theme: Partial<BotTheme>) => Promise<boolean>;
  updateBotSettings: (botId: string, settings: Partial<BotSettings>) => Promise<boolean>;
  
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
        set({ isLoading: true, error: null });
        
        // Rate limiting check
        const rateCheck = globalRateLimiter.canProceed(`register_${email}`);
        if (!rateCheck.allowed) {
          const minutes = Math.ceil((rateCheck.resetTime! - Date.now()) / 60000);
          set({ error: `Too many attempts. Please try again in ${minutes} minutes.`, isLoading: false });
          return false;
        }
        
        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          set({ error: emailValidation.error, isLoading: false });
          return false;
        }
        
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          set({ error: passwordValidation.error, isLoading: false });
          return false;
        }
        
        // Validate display name
        const nameValidation = validateBotName(displayName);
        if (!nameValidation.isValid) {
          set({ error: 'Please enter a valid display name (2-100 characters)', isLoading: false });
          return false;
        }
        
        // Sanitize inputs
        const sanitizedEmail = emailValidation.sanitized!;
        const sanitizedName = sanitizeInput(displayName).trim();
        
        // Check if email already exists
        const existingUser = get().users.find(u => u.email.toLowerCase() === sanitizedEmail.toLowerCase());
        if (existingUser) {
          set({ error: 'Email already registered', isLoading: false });
          return false;
        }
        
        // Record rate limit attempt
        globalRateLimiter.recordAttempt(`register_${email}`);
        
        // If Supabase is configured, use it
        if (isSupabaseConfigured() && supabase) {
          const { data, error } = await signUp(sanitizedEmail, password, { display_name: sanitizedName });
          if (error) {
            set({ error: error.message, isLoading: false });
            return false;
          }
          if (data?.user) {
            const newUser: User = {
              id: data.user.id,
              email: sanitizedEmail,
              displayName: sanitizedName,
              role: 'user',
              isActive: true,
              createdAt: new Date(data.user.created_at || Date.now()),
              subscription: { tier: 'free', status: 'active', expiresAt: new Date(Date.now() + 30*24*60*60*1000) }
            };
            set(state => ({ users: [...state.users, newUser], user: newUser, isAuthenticated: true, isLoading: false }));
            return true;
          }
        }
        
        // Fallback: Create locally
        const newUser: User = { 
          id: `user_${Date.now()}`, 
          email: sanitizedEmail, 
          displayName: sanitizedName, 
          role: 'user', 
          isActive: true, 
          createdAt: new Date(), 
          subscription: { tier: 'free', status: 'active', expiresAt: new Date(Date.now() + 30*24*60*60*1000) } 
        };
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
      
      createChatbot: async (botData) => {
        const state = get();
        if (!state.user) return null;
        
        // Validate bot name
        const nameValidation = validateBotName(botData.name || '');
        if (!nameValidation.isValid) {
          set({ error: nameValidation.error });
          return null;
        }
        
        // Validate industry
        const industryValidation = validateIndustry(botData.industry || '');
        if (!industryValidation.isValid) {
          set({ error: industryValidation.error });
          return null;
        }
        
        // Validate and sanitize description
        const descValidation = validateDescription(botData.description || '');
        if (!descValidation.isValid) {
          set({ error: descValidation.error });
          return null;
        }
        
        // Sanitize inputs
        const sanitizedName = nameValidation.sanitized!;
        const sanitizedIndustry = industryValidation.sanitized!;
        const sanitizedDescription = descValidation.sanitized!;
        const sanitizedTargetAudience = sanitizeInput(botData.targetAudience || '');
        
        // Rate limiting
        const rateCheck = globalRateLimiter.canProceed(`create_bot_${state.user.id}`);
        if (!rateCheck.allowed) {
          set({ error: 'Too many bots created. Please try again later.' });
          return null;
        }
        
        // Record rate limit attempt
        globalRateLimiter.recordAttempt(`create_bot_${state.user.id}`);
        
        // If Supabase is configured, save to database
        if (isSupabaseConfigured() && supabase) {
          const dbBot: Database['public']['Tables']['chatbots']['Insert'] = {
            user_id: state.user.id,
            name: sanitizedName,
            description: sanitizedDescription,
            industry: sanitizedIndustry,
            target_audience: sanitizedTargetAudience,
            tone: botData.tone || 'friendly',
            flow_data: (botData.flow || { nodes: [], edges: [] }) as any,
            is_published: false,
            is_active: false,
            settings: (botData.settings || {
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
            }) as any
          };
          
          const { data, error } = await createChatbotInDB(dbBot);
          if (error) {
            console.error('Failed to create chatbot in DB:', error);
            // Fall through to local creation
          } else if (data) {
            // Convert DB format to app format
            const newBot: Chatbot = {
              id: data.id,
              userId: data.user_id || state.user.id,
              name: data.name,
              description: data.description || '',
              industry: data.industry || 'General',
              targetAudience: data.target_audience || '',
              tone: (data.tone as any) || 'friendly',
              flow: (data.flow_data as any) || { nodes: [], edges: [] },
              published: data.is_published || false,
              status: data.is_published ? 'active' : 'draft',
              channels: [],
              createdAt: new Date(data.created_at),
              updatedAt: new Date(data.updated_at),
              settings: (data.settings as any) || {}
            };
            set(state => ({ chatbots: [...state.chatbots, newBot] }));
            return newBot;
          }
        }
        
        // Fallback: Create locally only
        const newBot: Chatbot = {
          id: `bot_${Date.now()}`,
          userId: state.user.id,
          name: sanitizedName,
          description: sanitizedDescription,
          industry: sanitizedIndustry,
          targetAudience: sanitizedTargetAudience,
          tone: botData.tone || 'friendly',
          flow: botData.flow || { nodes: [], edges: [] },
          published: false,
          status: 'draft',
          channels: [],
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
      
      updateChatbot: async (id, updates) => {
        const state = get();
        const bot = state.chatbots.find(c => c.id === id);
        if (!bot) return false;
        if (!state.canEditBot(id)) return false;
        
        // Validate and sanitize updates
        const sanitizedUpdates: Partial<Chatbot> = {};
        
        if (updates.name) {
          const nameValidation = validateBotName(updates.name);
          if (!nameValidation.isValid) {
            set({ error: nameValidation.error });
            return false;
          }
          sanitizedUpdates.name = nameValidation.sanitized;
        }
        
        if (updates.industry) {
          const industryValidation = validateIndustry(updates.industry);
          if (!industryValidation.isValid) {
            set({ error: industryValidation.error });
            return false;
          }
          sanitizedUpdates.industry = industryValidation.sanitized;
        }
        
        if (updates.description) {
          const descValidation = validateDescription(updates.description);
          if (!descValidation.isValid) {
            set({ error: descValidation.error });
            return false;
          }
          sanitizedUpdates.description = descValidation.sanitized;
        }
        
        if (updates.targetAudience) {
          sanitizedUpdates.targetAudience = sanitizeInput(updates.targetAudience);
        }
        
        // Update in Supabase if configured
        if (isSupabaseConfigured() && supabase && !id.startsWith('bot_')) {
          const dbUpdates: Database['public']['Tables']['chatbots']['Update'] = {};
          if (sanitizedUpdates.name) dbUpdates.name = sanitizedUpdates.name;
          if (sanitizedUpdates.description) dbUpdates.description = sanitizedUpdates.description;
          if (sanitizedUpdates.industry) dbUpdates.industry = sanitizedUpdates.industry;
          if (sanitizedUpdates.targetAudience) dbUpdates.target_audience = sanitizedUpdates.targetAudience;
          if (updates.tone) dbUpdates.tone = updates.tone;
          if (updates.flow) dbUpdates.flow_data = updates.flow as any;
          if (updates.settings) dbUpdates.settings = updates.settings as any;
          if (updates.published !== undefined) dbUpdates.is_published = updates.published;
          if (updates.status) dbUpdates.is_active = updates.status === 'active';
          
          const { error } = await updateChatbotInDB(id, dbUpdates);
          if (error) {
            console.error('Failed to update chatbot in DB:', error);
          }
        }
        
        // Merge sanitized updates with original updates
        const finalUpdates = { ...updates, ...sanitizedUpdates };
        
        set(state => ({
          chatbots: state.chatbots.map(c => 
            c.id === id 
              ? { ...c, ...finalUpdates, updatedAt: new Date(), lastModifiedAt: new Date() } 
              : c
          ),
          currentChatbot: state.currentChatbot?.id === id 
            ? { ...state.currentChatbot, ...finalUpdates, updatedAt: new Date(), lastModifiedAt: new Date() }
            : state.currentChatbot
        }));
        return true;
      },
      
      deleteChatbot: async (id) => {
        const state = get();
        if (!state.canDeleteBot(id)) return false;
        
        // Delete from Supabase if configured and not a local bot
        if (isSupabaseConfigured() && supabase && !id.startsWith('bot_')) {
          const { error } = await deleteChatbotInDB(id);
          if (error) {
            console.error('Failed to delete chatbot from DB:', error);
            return false;
          }
        }
        
        set(state => ({
          chatbots: state.chatbots.filter(c => c.id !== id),
          currentChatbot: state.currentChatbot?.id === id ? null : state.currentChatbot
        }));
        return true;
      },
      
      saveDraft: async (id) => {
        return await get().updateChatbot(id, { 
          status: 'draft', 
          published: false,
          lastModifiedAt: new Date()
        });
      },
      
      publishBot: async (id) => {
        return await get().updateChatbot(id, { 
          status: 'active', 
          published: true,
          updatedAt: new Date()
        });
      },
      
      activateBot: async (id) => {
        return await get().updateChatbot(id, { 
          status: 'active',
          updatedAt: new Date()
        });
      },
      
      deactivateBot: async (id) => {
        return await get().updateChatbot(id, { 
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
      
      updateBotTheme: async (botId, theme) => {
        const state = get();
        const bot = state.chatbots.find(c => c.id === botId);
        if (!bot || !state.canEditBot(botId)) return false;
        
        return await state.updateChatbot(botId, {
          theme: { ...bot.theme, ...theme }
        });
      },
      
      updateBotSettings: async (botId, settings) => {
        const state = get();
        const bot = state.chatbots.find(c => c.id === botId);
        if (!bot || !state.canEditBot(botId)) return false;
        
        return await state.updateChatbot(botId, {
          settings: { ...bot.settings, ...settings }
        });
      },
      
      // Supabase integration functions
      loadChatbots: async () => {
        if (!isSupabaseConfigured() || !supabase) {
          console.log('Supabase not configured, using local data');
          return;
        }
        
        const state = get();
        if (!state.user) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await fetchChatbots(state.user.id);
          if (error) throw error;
          
          if (data) {
            // Convert DB format to app format
            const bots: Chatbot[] = data.map((dbBot: any) => ({
              id: dbBot.id,
              userId: dbBot.user_id,
              name: dbBot.name,
              description: dbBot.description || '',
              industry: dbBot.industry || 'General',
              targetAudience: dbBot.target_audience || '',
              tone: dbBot.tone || 'friendly',
              flow: dbBot.flow_data || { nodes: [], edges: [] },
              published: dbBot.is_published || false,
              status: dbBot.is_published ? (dbBot.is_active ? 'active' : 'inactive') : 'draft',
              channels: [],
              createdAt: new Date(dbBot.created_at),
              updatedAt: new Date(dbBot.updated_at),
              settings: dbBot.settings || {}
            }));
            
            set({ chatbots: bots, isLoading: false });
          }
        } catch (err: any) {
          console.error('Failed to load chatbots:', err);
          set({ error: err.message, isLoading: false });
        }
      },
      
      loadCurrentUser: async () => {
        if (!isSupabaseConfigured() || !supabase) return;
        
        set({ isLoading: true });
        
        try {
          const { data: { user } } = await getCurrentUser();
          if (user) {
            // Fetch profile data
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            const appUser: User = {
              id: user.id,
              email: user.email || '',
              displayName: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
              role: user.user_metadata?.role || 'user',
              isActive: true,
              createdAt: new Date(user.created_at || Date.now()),
              subscription: {
                tier: user.user_metadata?.subscription_tier || 'free',
                status: 'active',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              },
              companyName: profile?.company_name,
              location: profile?.location,
              photoURL: profile?.avatar_url
            };
            
            set({ 
              user: appUser, 
              isAuthenticated: true, 
              isAdmin: appUser.role === 'admin',
              isLoading: false 
            });
            
            // Load user's chatbots
            await get().loadChatbots();
          }
        } catch (err: any) {
          console.error('Failed to load current user:', err);
          set({ isLoading: false });
        }
      },
      
      isUsingRealBackend: () => {
        return isSupabaseConfigured() && !!supabase;
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