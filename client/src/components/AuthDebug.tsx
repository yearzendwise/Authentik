import { useEffect, useState } from 'react';
import { authManager } from '@/lib/auth';

export function AuthDebug() {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const currentToken = authManager.getAccessToken();
      setToken(currentToken);
      setIsAuthenticated(authManager.isAuthenticated());
    };

    checkAuth();
    
    // Check every second
    const interval = setInterval(checkAuth, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 text-sm">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>Token: {token ? `${token.substring(0, 20)}...` : 'No token'}</div>
      <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      <div>LocalStorage auth_access_token: {localStorage.getItem('auth_access_token') ? 'Present' : 'Missing'}</div>
    </div>
  );
}