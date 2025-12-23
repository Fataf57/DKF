import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { getProfile, clearAuthTokens } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await getProfile();
          setUser(userData);
        } catch (error) {
          // Token invalid, clear it
          clearAuthTokens();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Écouter l'événement de déconnexion déclenché par l'API
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    clearAuthTokens();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;
