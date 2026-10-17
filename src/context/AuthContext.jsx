import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('pos_token') || null);
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load branches
  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      if (res.data.success) {
        setBranches(res.data.branches);
        // Set active branch from localStorage or user's branch or first branch
        const savedBranchId = localStorage.getItem('pos_active_branch_id');
        const found = res.data.branches.find(b => b.id === savedBranchId);
        if (found) {
          setActiveBranch(found);
        } else if (user?.branchId) {
          const userBranch = res.data.branches.find(b => b.id === user.branchId);
          setActiveBranch(userBranch || res.data.branches[0]);
        } else if (res.data.branches.length > 0) {
          setActiveBranch(res.data.branches[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  // Verify auth on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('pos_user', JSON.stringify(res.data.user));
            await fetchBranches();
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('pos_token', newToken);
      localStorage.setItem('pos_user', JSON.stringify(newUser));
      await fetchBranches();
      return newUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
  };

  const switchBranch = (branch) => {
    setActiveBranch(branch);
    localStorage.setItem('pos_active_branch_id', branch.id);
  };

  const hasRole = (...allowedRoles) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        branches,
        activeBranch,
        switchBranch,
        login,
        logout,
        hasRole,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
