import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useChatbotStore } from './stores/chatbotStore';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Pricing = lazy(() => import('./pages/Pricing'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const PRDBuilder = lazy(() => import('./pages/PRDBuilder'));
const FlowBuilder = lazy(() => import('./pages/FlowBuilder'));
const ChatPreview = lazy(() => import('./pages/ChatPreview'));
const Settings = lazy(() => import('./pages/Settings'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const PaymentGateway = lazy(() => import('./pages/PaymentGateway'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Integrations = lazy(() => import('./pages/Integrations'));
const NLPTraining = lazy(() => import('./pages/NLPTraining'));
const EmbedCode = lazy(() => import('./pages/EmbedCode'));
const UserGuide = lazy(() => import('./pages/UserGuide'));
const ClientCredentials = lazy(() => import('./pages/ClientCredentials'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const Invoice = lazy(() => import('./pages/Invoice'));

function App() {
  const { isAuthenticated, isAdmin, user } = useChatbotStore();

  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>}>
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
        <Route path="/analytics" element={!isAuthenticated ? <Navigate to="/login" /> : <Analytics />} />
        <Route path="/integrations" element={!isAuthenticated ? <Navigate to="/login" /> : <Integrations />} />
        <Route path="/nlp" element={!isAuthenticated ? <Navigate to="/login" /> : <NLPTraining />} />
        <Route path="/embed" element={!isAuthenticated ? <Navigate to="/login" /> : <EmbedCode />} />
        <Route path="/guide" element={<UserGuide />} />
        <Route path="/credentials" element={!isAuthenticated ? <Navigate to="/login" /> : <ClientCredentials />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/invoice" element={<Invoice />} />
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;