import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Integrations from '../pages/Integrations';
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

describe('Integrations Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the integrations page', () => {
    renderWithProvider(<Integrations />);
    expect(screen.getByText(/integrations & channels/i)).toBeInTheDocument();
  });

  it('should have tab navigation', () => {
    renderWithProvider(<Integrations />);
    expect(screen.getByText(/channels/i)).toBeInTheDocument();
    expect(screen.getByText(/templates/i)).toBeInTheDocument();
    expect(screen.getByText(/knowledge base/i)).toBeInTheDocument();
    expect(screen.getByText(/human handoff/i)).toBeInTheDocument();
    expect(screen.getByText(/a.b testing/i)).toBeInTheDocument();
    expect(screen.getByText(/calendar/i)).toBeInTheDocument();
  });

  it('should render channel cards', () => {
    renderWithProvider(<Integrations />);
    expect(screen.getByText(/whatsapp/i)).toBeInTheDocument();
    expect(screen.getByText(/telegram/i)).toBeInTheDocument();
    expect(screen.getByText(/slack/i)).toBeInTheDocument();
    expect(screen.getByText(/discord/i)).toBeInTheDocument();
    expect(screen.getByText(/web widget/i)).toBeInTheDocument();
  });

  it('should have embed code section for web widget', () => {
    renderWithProvider(<Integrations />);
    expect(screen.getByText(/web widget embed code/i)).toBeInTheDocument();
  });
});

describe('Integrations Tab Navigation', () => {
  it('should switch to templates tab', () => {
    renderWithProvider(<Integrations />);
    const templatesTab = screen.getByText(/templates/i);
    fireEvent.click(templatesTab);
    // Templates should now be visible
    expect(screen.getByText(/customer support bot/i)).toBeInTheDocument();
  });

  it('should switch to knowledge base tab', () => {
    renderWithProvider(<Integrations />);
    const knowledgeTab = screen.getByText(/knowledge base/i);
    fireEvent.click(knowledgeTab);
    expect(screen.getByText(/add knowledge sources/i)).toBeInTheDocument();
  });

  it('should switch to human handoff tab', () => {
    renderWithProvider(<Integrations />);
    const handoffTab = screen.getByText(/human handoff/i);
    fireEvent.click(handoffTab);
    expect(screen.getByText(/active agents/i)).toBeInTheDocument();
  });

  it('should switch to calendar tab', () => {
    renderWithProvider(<Integrations />);
    const calendarTab = screen.getByText(/calendar/i);
    fireEvent.click(calendarTab);
    expect(screen.getByText(/google calendar/i)).toBeInTheDocument();
    expect(screen.getByText(/calendly/i)).toBeInTheDocument();
  });
});

describe('Integrations Channels', () => {
  it('should show connect buttons for channels', () => {
    renderWithProvider(<Integrations />);
    const connectButtons = screen.getAllByText(/connect/i);
    expect(connectButtons.length).toBeGreaterThan(0);
  });
});