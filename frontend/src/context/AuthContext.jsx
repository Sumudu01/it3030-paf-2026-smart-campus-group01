import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication using REST API
  const checkAuth = async () => {
    try {
      // Use the new REST API endpoint
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initiate OAuth login
  const login = () => {
    window.location.href = authAPI.getLoginUrl();
  };

  // Logout
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    window.location.href = '/';
  };

  // Update user profile
  const updateProfile = async (name, picture) => {
    try {
      const response = await authAPI.updateProfile(name, picture);
      // Refresh user data after update
      await checkAuth();
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  // Check if user is admin
  const isAdmin = () => hasRole('ADMIN');

  // Check if user is technician
  const isTechnician = () => hasRole('TECHNICIAN');

  // Check if user is staff member
  const isStaff = () => hasRole('STAFFMEMBER');

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      checkAuth,
      updateProfile,
      hasRole,
      isAdmin,
      isTechnician,
      isStaff
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
