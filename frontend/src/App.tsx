import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useChatbotStore } from './stores/chatbotStore';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import PRDBuilder from './pages/PRDBuilder';
import FlowBuilder from './pages/FlowBuilder';
import ChatPreview from './pages/ChatPreview';
import AgentDashboard from './pages/AgentDashboard';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

function App() {
  const { user } = useChatbotStore();

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/prd" element={user ? <PRDBuilder /> : <Navigate to="/" />} />
        <Route path="/flow" element={user ? <FlowBuilder /> : <Navigate to="/" />} />
        <Route path="/preview" element={user ? <ChatPreview /> : <Navigate to="/" />} />
        <Route path="/agent" element={user ? <AgentDashboard /> : <Navigate to="/" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
        <Route path="/admin" element={user ? <Admin /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;