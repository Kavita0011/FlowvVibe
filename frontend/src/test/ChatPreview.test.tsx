import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChatPreview from '../pages/ChatPreview';
import { ChatbotProvider } from '../stores/chatbotStore';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ChatbotProvider>
        {component}
      </ChatbotProvider>
    </BrowserRouter>
  );
};

describe('ChatPreview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the chat preview page', () => {
    renderWithProvider(<ChatPreview />);
    expect(screen.getByText(/chat preview/i)).toBeInTheDocument();
  });

  it('should have a message input field', () => {
    renderWithProvider(<ChatPreview />);
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
  });

  it('should have a send button', () => {
    renderWithProvider(<ChatPreview />);
    const sendButton = document.querySelector('button[type="submit"]');
    expect(sendButton).toBeInTheDocument();
  });

  it('should have reset button', () => {
    renderWithProvider(<ChatPreview />);
    expect(screen.getByText(/reset/i)).toBeInTheDocument();
  });

  it('should have export widget button', () => {
    renderWithProvider(<ChatPreview />);
    expect(screen.getByText(/export widget/i)).toBeInTheDocument();
  });
});

describe('ChatPreview Interactions', () => {
  it('should have voice toggle button', () => {
    renderWithProvider(<ChatPreview />);
    const voiceToggle = screen.getByTitle(/toggle voice features/i);
    expect(voiceToggle).toBeInTheDocument();
  });

  it('should enable voice controls when toggled', () => {
    renderWithProvider(<ChatPreview />);
    const voiceToggle = screen.getByTitle(/toggle voice features/i);
    fireEvent.click(voiceToggle);
    // Voice mic button should appear
    expect(screen.getByTitle(/voice input/i)).toBeInTheDocument();
  });

  it('should have quick replies section', () => {
    renderWithProvider(<ChatPreview />);
    expect(screen.getByText(/quick replies/i)).toBeInTheDocument();
  });
});

describe('ChatPreview Message Sending', () => {
  it('should allow typing in input field', () => {
    renderWithProvider(<ChatPreview />);
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(input).toHaveValue('Hello');
  });

  it('should clear input after sending', async () => {
    renderWithProvider(<ChatPreview />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
});