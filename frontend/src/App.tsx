import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useChatbotStore } from './stores/chatbotStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import UserDashboard from './pages/UserDashboard';
import PRDBuilder from './pages/PRDBuilder';
import FlowBuilder from './pages/FlowBuilder';
import ChatPreview from './pages/ChatPreview';
import Settings from './pages/Settings';
import AgentDashboard from './pages/AgentDashboard';
import Admin from './pages/Admin';
import AdminSettings from './pages/AdminSettings';
import PaymentGateway from './pages/PaymentGateway';

function App() {
  const { isAuthenticated, isAdmin, user } = useChatbotStore();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        
        <Route path="/dashboard" element={!isAuthenticated ? <Navigate to="/login" /> : isAdmin ? <Navigate to="/admin" /> : <UserDashboard />} />
        <Route path="/prd" element={!isAuthenticated ? <Navigate to="/login" /> : <PRDBuilder />} />
        <Route path="/flow" element={!isAuthenticated ? <Navigate to="/login" /> : <FlowBuilder />} />
        <Route path="/preview" element={!isAuthenticated ? <Navigate to="/login" /> : <ChatPreview />} />
        <Route path="/settings" element={!isAuthenticated ? <Navigate to="/login" /> : <Settings />} />
        <Route path="/agent" element={!isAuthenticated ? <Navigate to="/login" /> : <AgentDashboard />} />
        
        <Route path="/admin" element={!isAuthenticated ? <Navigate to="/login" /> : isAdmin ? <Admin /> : <Navigate to="/dashboard" />} />
        <Route path="/admin/settings" element={!isAuthenticated ? <Navigate to="/login" /> : isAdmin ? <AdminSettings /> : <Navigate to="/dashboard" />} />
        
        <Route path="/payment" element={!isAuthenticated ? <Navigate to="/login" /> : <PaymentGateway />} />
      </Routes>
    </Router>
  );
}

export default App;