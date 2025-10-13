import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchProfile, logout as logoutRequest } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const token = localStorage.getItem('kris-kringle-token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await fetchProfile();
        setUser({
          id: data.employee.id,
          name: data.employee.name,
          email: data.employee.email,
          isAdmin: data.employee.is_admin,
          isSuperAdmin: data.employee.is_super_admin
        });
      } catch (error) {
        localStorage.removeItem('kris-kringle-token');
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  async function logout() {
    const token = localStorage.getItem('kris-kringle-token');
    try {
      await logoutRequest(token);
    } finally {
      localStorage.removeItem('kris-kringle-token');
      setUser(null);
      toast.success('Logged out');
    }
  }

  const value = useMemo(() => ({ user, setUser, logout, loading }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('AuthContext unavailable');
  }
  return context;
}
