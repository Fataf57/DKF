import React, { useState } from 'react';
import { login, setAuthTokens } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(username, password);
      setAuthTokens(response.access, response.refresh);
      
      if (onLoginSuccess) {
        onLoginSuccess(response.user);
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <img src="/logo-dkf.jpeg" alt="Super DKF" className="h-20 w-auto" />
            </div>
            <CardTitle className="text-2xl">Super DKF</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7.25-3.25a.75.75 0 0 0-1.5 0v4.5a.75.75 0 0 0 1.5 0Zm0 6.5a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>
                  </svg>
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-foreground">
                  Nom d'utilisateur
                </label>
                <Input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="username"
                  placeholder="Entrez votre nom d'utilisateur"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mot de passe
                </label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder="Entrez votre mot de passe"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;


