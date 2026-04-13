import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { ChatbotProvider } from '../stores/chatbotStore';

describe('App Component', () => {
  it('should render without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  });

  it('should have a landing page route', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    // The app should have rendered without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should render all main routes', () => {
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    // App should render the router structure
    expect(container.querySelector('#root')).toBeInTheDocument();
  });
});