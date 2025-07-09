
import React, { useState } from 'react';
import Login from '../components/Auth/Login';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      console.log('Attempting login...');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      console.log('Login response:', data);
      if (!res.ok) throw new Error(data.message || 'Login failed');
      console.log('Login successful, calling login function...');
      login(data.token, data.user);
      console.log('Navigating to /board...');
      navigate('/board');
    } catch (err) {
      console.error('Login error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Login onLogin={handleLogin} loading={loading} />
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        Don't have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default LoginPage; 