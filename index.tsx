import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { LegalPage } from './components/LegalPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const path = window.location.pathname;

root.render(
  <React.StrictMode>
    {path === '/admin' ? (
      <AdminDashboard />
    ) : path === '/dashboard' ? (
      <AuthProvider>
        <UserDashboard />
      </AuthProvider>
    ) : path === '/privacy' || path === '/terms' || path === '/legal' ? (
      <AuthProvider>
        <LegalPage />
      </AuthProvider>
    ) : (
      <AuthProvider>
        <App />
      </AuthProvider>
    )}
  </React.StrictMode>
);