import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useChatbotStore } from '../stores/chatbotStore';

describe('ChatbotStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useChatbotStore.getState();
    store.setCurrentChatbot(null);
    store.setFlowData(null);
    store.setPRD(null);
    store.setUser(null);
  });

  it('should have initial state', () => {
    const state = useChatbotStore.getState();
    expect(state.currentChatbot).toBeNull();
    expect(state.flow).toBeNull();
    expect(state.prd).toBeNull();
    expect(state.user).toBeNull();
  });

  it('should set current chatbot', () => {
    const mockChatbot = {
      id: '1',
      name: 'Test Bot',
      industry: 'E-commerce',
    };
    
    act(() => {
      useChatbotStore.getState().setCurrentChatbot(mockChatbot as any);
    });
    
    expect(useChatbotStore.getState().currentChatbot).toEqual(mockChatbot);
  });

  it('should set flow data', () => {
    const mockFlow = {
      nodes: [{ id: '1', type: 'start' }],
      edges: [],
    };
    
    act(() => {
      useChatbotStore.getState().setFlowData(mockFlow as any);
    });
    
    expect(useChatbotStore.getState().flow).toEqual(mockFlow);
  });

  it('should set PRD data', () => {
    const mockPRD = {
      companyName: 'Test Company',
      industry: 'Tech',
    };
    
    act(() => {
      useChatbotStore.getState().setPRD(mockPRD as any);
    });
    
    expect(useChatbotStore.getState().prd).toEqual(mockPRD);
  });

  it('should set user data', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };
    
    act(() => {
      useChatbotStore.getState().setUser(mockUser as any);
    });
    
    expect(useChatbotStore.getState().user).toEqual(mockUser);
  });

  it('should handle isAuthenticated based on user', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };
    
    act(() => {
      useChatbotStore.getState().setUser(mockUser as any);
    });
    
    expect(useChatbotStore.getState().isAuthenticated).toBe(true);
  });

  it('should handle isAdmin based on role', () => {
    const adminUser = {
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
    };
    
    act(() => {
      useChatbotStore.getState().setUser(adminUser as any);
    });
    
    expect(useChatbotStore.getState().isAdmin).toBe(true);
  });

  it('should clear all state on logout', () => {
    // Set some state first
    act(() => {
      useChatbotStore.getState().setUser({ id: '1', email: 'test@example.com', role: 'user' } as any);
      useChatbotStore.getState().setCurrentChatbot({ id: '1', name: 'Test' } as any);
    });
    
    // Clear state
    act(() => {
      useChatbotStore.getState().logout();
    });
    
    const state = useChatbotStore.getState();
    expect(state.user).toBeNull();
    expect(state.currentChatbot).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

describe('Store Actions', () => {
  it('should update chatbot', () => {
    act(() => {
      useChatbotStore.getState().setCurrentChatbot({
        id: '1',
        name: 'Updated Bot',
      } as any);
    });
    
    expect(useChatbotStore.getState().currentChatbot?.name).toBe('Updated Bot');
  });

  it('should set isPro based on subscription', () => {
    const proUser = {
      id: '1',
      email: 'pro@example.com',
      role: 'user',
      subscription: { tier: 'pro' },
    };
    
    act(() => {
      useChatbotStore.getState().setUser(proUser as any);
    });
    
    expect(useChatbotStore.getState().isPro).toBe(true);
  });
});