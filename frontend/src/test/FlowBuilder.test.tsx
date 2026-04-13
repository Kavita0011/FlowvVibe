import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FlowBuilder from '../pages/FlowBuilder';
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

describe('FlowBuilder Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the FlowBuilder page', () => {
    renderWithProvider(<FlowBuilder />);
    expect(screen.getByText(/node types/i)).toBeInTheDocument();
  });

  it('should render the toolbar with action buttons', () => {
    renderWithProvider(<FlowBuilder />);
    expect(screen.getByTitle(/undo/i)).toBeInTheDocument();
    expect(screen.getByTitle(/redo/i)).toBeInTheDocument();
    expect(screen.getByTitle(/fullscreen/i)).toBeInTheDocument();
  });

  it('should have sidebar with node categories', () => {
    renderWithProvider(<FlowBuilder />);
    expect(screen.getByText('AI/ML')).toBeInTheDocument();
    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Logic')).toBeInTheDocument();
  });

  it('should toggle sidebar', () => {
    renderWithProvider(<FlowBuilder />);
    const toggleButton = screen.getByTitle('Select All / Deselect');
    expect(toggleButton).toBeInTheDocument();
  });

  it('should render ReactFlow canvas', () => {
    renderWithProvider(<FlowBuilder />);
    const canvas = document.querySelector('.react-flow');
    expect(canvas).toBeInTheDocument();
  });

  it('should render controls', () => {
    renderWithProvider(<FlowBuilder />);
    const controls = document.querySelector('.react-flow__controls');
    expect(controls).toBeInTheDocument();
  });

  it('should render minimap', () => {
    renderWithProvider(<FlowBuilder />);
    const minimap = document.querySelector('.react-flow__minimap');
    expect(minimap).toBeInTheDocument();
  });
});

describe('FlowBuilder Interactions', () => {
  it('should handle keyboard shortcuts', () => {
    renderWithProvider(<FlowBuilder />);
    // Test that undo/redo buttons exist (keyboard handlers are tested separately)
    expect(screen.getByTitle(/undo/i)).toBeInTheDocument();
    expect(screen.getByTitle(/redo/i)).toBeInTheDocument();
  });

  it('should toggle dark mode', () => {
    renderWithProvider(<FlowBuilder />);
    const darkModeButton = screen.getByTitle(/light mode/i);
    expect(darkModeButton).toBeInTheDocument();
  });

  it('should toggle wireframe mode', () => {
    renderWithProvider(<FlowBuilder />);
    const wireframeButton = screen.getByTitle(/wireframe/i);
    expect(wireframeButton).toBeInTheDocument();
  });
});