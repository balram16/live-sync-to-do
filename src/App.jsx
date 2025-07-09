import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardPage from './pages/BoardPage';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppRoutes({ theme, toggleTheme }) {
  const { token } = useAuth();
  
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
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className={`theme-${theme}`}>
      <AuthProvider>
        <Router>
          <AppRoutes theme={theme} toggleTheme={toggleTheme} />
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App; 