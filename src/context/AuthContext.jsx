import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  // Fetch user info if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        return;
      }
      try {
        console.log('Fetching user data with token...');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          console.log('Token validation failed, clearing token');
          setToken(null);
          setUser(null);
          return;
        }
        console.log('User data fetched successfully:', data);
        setUser(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setToken(null);
        setUser(null);
      }
    };
    fetchUser();
  }, [token]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = (token, user) => {
    console.log('AuthContext login called with token:', token ? 'present' : 'missing', 'user:', user);
    setToken(token);
    setUser(user || null);
  };
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 