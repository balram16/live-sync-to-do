import React from 'react';
import { Board } from '../components/Kanban';
import ThemeToggle from '../components/Kanban/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const BoardPage = ({ theme, toggleTheme }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className={`page-container theme-${theme}`}>
      <Board theme={theme} toggleTheme={toggleTheme} />
    </div>
  );
};

export default BoardPage; 