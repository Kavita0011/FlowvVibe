import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useChatbotStore } from './stores/chatbotStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import UserDashboard from './pages/UserDashboard';
import Admin from './pages/Admin';
import AdminSettings from './pages/AdminSettings';
import PaymentGateway from './pages/PaymentGateway';

function App() {
  const { isAuthenticated, isAdmin } = useChatbotStore();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/dashboard" element={!isAuthenticated ? <Navigate to="/login" /> : isAdmin ? <Admin /> : <UserDashboard />} />
        <Route path="/admin" element={!isAuthenticated ? <Navigate to="/login" /> : isAdmin ? <Admin /> : <Navigate to="/dashboard" />} />
        <Route path="/admin/settings" element={!isAuthenticated ? <Navigate to="/login" /> : isAdmin ? <AdminSettings /> : <Navigate to="/dashboard" />} />
        <Route path="/payment" element={!isAuthenticated ? <Navigate to="/login" /> : <PaymentGateway />} />
      </Routes>
    </Router>
  );
}

export default App;