import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useChatbotStore } from './stores/chatbotStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import Admin from './pages/Admin';

function App() {
  const { user, isAdmin, isAuthenticated } = useChatbotStore();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={!isAuthenticated ? <Navigate to="/login" /> : isAdmin ? <Admin /> : <UserDashboard />} />
        <Route path="/admin" element={!isAuthenticated ? <Navigate to="/login" /> : isAdmin ? <Admin /> : <Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;