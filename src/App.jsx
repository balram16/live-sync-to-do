import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardPage from './pages/BoardPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { checkEnvironment } from './utils/envCheck';
import ErrorBoundary from './components/ErrorBoundary';

function AppRoutes({ theme, toggleTheme }) {
  const { token } = useAuth();
  
  console.log('AppRoutes - current token:', token ? 'present' : 'missing');
  console.log('AppRoutes - current pathname:', window.location.pathname);
  
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/board" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/board" replace /> : <RegisterPage />} />
      <Route path="/board" element={<BoardPage theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="*" element={<Navigate to={token ? "/board" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  
  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    checkEnvironment();
  }, []);
  
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ErrorBoundary>
      <div className={`theme-${theme}`}>
        <AuthProvider>
          <Router>
            <AppRoutes theme={theme} toggleTheme={toggleTheme} />
          </Router>
        </AuthProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App; 