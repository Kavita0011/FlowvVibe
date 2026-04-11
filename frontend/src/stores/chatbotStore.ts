import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chatbot, PRD, FlowData, FlowNode, FlowEdge, Conversation, Message, User } from '@/types';

interface ChatbotState {
  user: User | null;
  chatbots: Chatbot[];
  currentChatbot: Chatbot | null;
  prd: PRD | null;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
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

export const useChatbotStore = create<ChatbotState>()(
  persist(
    (set) => ({
      user: null,
      chatbots: [],
      currentChatbot: null,
      prd: null,
      conversations: [],
      currentConversation: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setChatbots: (chatbots) => set({ chatbots }),
      setCurrentChatbot: (chatbot) => set({ currentChatbot: chatbot }),
      setPRD: (prd) => set({ prd }),
      updatePRD: (updates) => set((state) => ({ 
        prd: state.prd ? { ...state.prd, ...updates } : null 
      })),
      setFlowData: (flow) => set((state) => ({
        currentChatbot: state.currentChatbot 
          ? { ...state.currentChatbot, flow }
          : null
      })),
      addNode: (node) => set((state) => {
        if (!state.currentChatbot) return state;
        const flow = state.currentChatbot.flow;
        return {
          currentChatbot: {
            ...state.currentChatbot,
            flow: { ...flow, nodes: [...flow.nodes, node] }
          }
        };
      }),
      updateNode: (id, updates) => set((state) => {
        if (!state.currentChatbot) return state;
        const flow = state.currentChatbot.flow;
        return {
          currentChatbot: {
            ...state.currentChatbot,
            flow: {
              ...flow,
              nodes: flow.nodes.map((n) => n.id === id ? { ...n, ...updates } : n)
            }
          }
        };
      }),
      removeNode: (id) => set((state) => {
        if (!state.currentChatbot) return state;
        const flow = state.currentChatbot.flow;
        return {
          currentChatbot: {
            ...state.currentChatbot,
            flow: {
              ...flow,
              nodes: flow.nodes.filter((n) => n.id !== id),
              edges: flow.edges.filter((e) => e.source !== id && e.target !== id)
            }
          }
        };
      }),
      addEdge: (edge) => set((state) => {
        if (!state.currentChatbot) return state;
        const flow = state.currentChatbot.flow;
        return {
          currentChatbot: {
            ...state.currentChatbot,
            flow: { ...flow, edges: [...flow.edges, edge] }
          }
        };
      }),
      removeEdge: (id) => set((state) => {
        if (!state.currentChatbot) return state;
        const flow = state.currentChatbot.flow;
        return {
          currentChatbot: {
            ...state.currentChatbot,
            flow: {
              ...flow,
              edges: flow.edges.filter((e) => e.id !== id)
            }
          }
        };
      }),
      setConversations: (conversations) => set({ conversations }),
      setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
      addMessage: (message) => set((state) => {
        if (!state.currentConversation) return state;
        return {
          currentConversation: {
            ...state.currentConversation,
            messages: [...state.currentConversation.messages, message]
          }
        };
      }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      reset: () => set({
        user: null,
        chatbots: [],
        currentChatbot: null,
        prd: null,
        conversations: [],
        currentConversation: null,
        isLoading: false,
        error: null
      })
    }),
    {
      name: 'flowvibe-storage',
      partialize: (state) => ({ user: state.user })
    }
  )
);