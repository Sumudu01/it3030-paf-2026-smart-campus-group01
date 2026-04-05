import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const VALID_ROLES = ['STUDENT', 'STAFFMEMBER', 'ADMIN', 'TECHNICIAN'];

  // Check authentication using REST API
  const checkAuth = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      let userData = response.data;
      
      // DEBUG: Log raw API response
      console.log('DEBUG API response:', JSON.stringify(userData, null, 2));
      
      // FORCE: Always use roleName from backend - ignore all other fields
      const apiRole = userData.roleName;
      
      // If roleName is valid, use it
      if (apiRole && VALID_ROLES.includes(apiRole)) {
        userData.role = apiRole;
        userData.rolePending = false; // Force false if valid role exists
      } 
      // If rolePending is true but roleName is invalid, force to PENDING
      else if (userData.rolePending === true) {
        userData.role = 'PENDING';
        console.warn('User has rolePending=true, roleName invalid:', apiRole);
      }
      // Otherwise default to STUDENT
      else {
        console.warn('Invalid role from API:', apiRole);
        userData.role = 'STUDENT';
        userData.roleName = 'STUDENT';
        userData.rolePending = false;
      }
      
      setUser(userData);
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

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user) return false;
    // Admin with all permissions has access to everything
    if (user.hasAllPermissions) return true;
    if (!user.permissions) return false;
    return user.permissions.includes(permission);
  };

  // Get all users (Admin only)
  const getAllUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      return response.data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  };

  // Update user role (Admin only)
  const updateUserRole = async (email, role) => {
    try {
      const response = await authAPI.updateUserRole(email, role);
      await checkAuth();
      return response.data;
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  };

  // Grant permissions to user (Admin only)
  const grantPermissions = async (email, permissions) => {
    try {
      const response = await authAPI.grantPermissions(email, permissions);
      return response.data;
    } catch (error) {
      console.error('Grant permissions error:', error);
      throw error;
    }
  };

  // Revoke permissions from user (Admin only)
  const revokePermissions = async (email, permissions) => {
    try {
      const response = await authAPI.revokePermissions(email, permissions);
      return response.data;
    } catch (error) {
      console.error('Revoke permissions error:', error);
      throw error;
    }
  };

  // Grant all permissions to user (Admin only)
  const grantAllPermissions = async (email) => {
    try {
      const response = await authAPI.grantAllPermissions(email);
      return response.data;
    } catch (error) {
      console.error('Grant all permissions error:', error);
      throw error;
    }
  };

  // Get all available permissions (Admin only)
  const getAllPermissions = async () => {
    try {
      const response = await authAPI.getAllPermissions();
      return response.data.permissions;
    } catch (error) {
      console.error('Get all permissions error:', error);
      throw error;
    }
  };

  // Enable/disable user (Admin only)
  const setUserEnabled = async (email, enabled) => {
    try {
      const response = await authAPI.setUserEnabled(email, enabled);
      return response.data;
    } catch (error) {
      console.error('Set user enabled error:', error);
      throw error;
    }
  };

  // Delete user (Admin only)
  const deleteUser = async (email) => {
    try {
      const response = await authAPI.deleteUser(email);
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  };

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
      isStaff,
      hasPermission,
      getAllUsers,
      updateUserRole,
      grantPermissions,
      revokePermissions,
      grantAllPermissions,
      getAllPermissions,
      setUserEnabled,
      deleteUser
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
