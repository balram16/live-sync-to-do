import React, { useState } from 'react';
import Register from '../components/Auth/Register';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const handleRegister = async (data) => {
    setLoading(true);
    try {
      const res = await fetch('${import.meta.env.VITE_API_URL}/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Registration failed');
      localStorage.setItem('token', result.token);
      navigate('/board');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Register onRegister={handleRegister} loading={loading} />
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
};

export default RegisterPage; 