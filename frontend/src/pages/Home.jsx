import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import AdminPanel from './AdminPanel';
import './Home.css';

const Home = () => {
  const { user, logout, updateProfile, checkAuth } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!user) {
    window.location.href = '/';
    return null;
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'TECHNICIAN': return 'role-technician';
      case 'STAFFMEMBER': return 'role-staff';
      default: return 'role-student';
    }
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleEditProfile = () => {
    setNewName(user.name);
    setShowProfileMenu(false);
    setShowProfileModal(true);
    setActiveTab('profile');
    setSuccessMessage('');
  };

  const handleOpenAdminPanel = () => {
    setShowProfileMenu(false);
    setShowProfileModal(true);
    setActiveTab('admin');
  };

  const handleSaveProfile = async () => {
    if (!newName.trim()) {
      return;
    }
    
    setSaving(true);
    try {
      await updateProfile(newName.trim(), null);
      await checkAuth();
      setSuccessMessage('Profile updated successfully!');
      setEditingName(false);
      setTimeout(() => {
        setShowProfileModal(false);
        setSuccessMessage('');
      }, 1500);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowProfileModal(false);
    setEditingName(false);
    setSuccessMessage('');
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <h1>Smart Campus Operations Hub</h1>
        <div className="user-info">
          {/* Profile Dropdown */}
          <div className="profile-dropdown">
            <button className="profile-trigger" onClick={handleProfileClick} type="button">
              {user.picture ? (
                <img src={user.picture} alt="Profile" className="profile-img" />
              ) : (
                <div className="profile-placeholder">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            
            {showProfileMenu && (
              <div className="profile-menu">
                <div className="menu-header">
                  <span className="menu-name">{user.name}</span>
                  <span className="menu-email">{user.email}</span>
                </div>
                <div className="menu-divider"></div>
                <button className="menu-item" onClick={handleEditProfile} type="button">
                  <span className="menu-icon">👤</span>
                  Edit Profile
                </button>
                {user.role === 'ADMIN' && (
                  <button className="menu-item" onClick={handleOpenAdminPanel} type="button">
                    <span className="menu-icon">⚙️</span>
                    Admin Panel
                  </button>
                )}
                <button className="menu-item" onClick={logout} type="button">
                  <span className="menu-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
          
          <span className="user-name">{user.name}</span>
          <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
            {user.role}
          </span>
          
          {/* Direct Profile Button */}
          <button className="profile-btn" onClick={handleEditProfile} type="button">
            My Profile
          </button>
        </div>
      </nav>

      <div className="content">
        <div className="welcome-card">
          <h2>Welcome, {user.name}!</h2>
          <p>You are successfully logged in to the Smart Campus Operations Hub.</p>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <label>Email</label>
            <span>{user.email}</span>
          </div>
          <div className="info-card">
            <label>Role</label>
            <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
              {user.role}
            </span>
          </div>
          <div className="info-card">
            <label>Session Status</label>
            <span className="status-active">Active</span>
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            {user.role === 'TECHNICIAN' && (
              <button className="action-btn technician">Technician Dashboard</button>
            )}
            {(user.role === 'STAFFMEMBER' || user.role === 'ADMIN') && (
              <button className="action-btn staff">Staff Portal</button>
            )}
            <button className="action-btn student" onClick={handleEditProfile}>My Profile</button>
            <a href="/bookings" className="action-btn booking">📅 My Bookings</a>
          </div>
        </div>

        {user.role === 'ADMIN' && (
          <div className="admin-section">
            <AdminPanel />
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className={`profile-modal ${activeTab === 'admin' ? 'admin-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {user.role === 'ADMIN' ? (
                <div className="modal-tabs">
                  <button
                    className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    Profile
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                    onClick={() => setActiveTab('admin')}
                  >
                    Admin Panel
                  </button>
                </div>
              ) : (
                <h2>Edit Profile</h2>
              )}
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              {activeTab === 'profile' ? (
                <>
                  <div className="profile-preview">
                    {user.picture ? (
                      <img src={user.picture} alt="Profile" className="profile-avatar-large" />
                    ) : (
                      <div className="profile-avatar-placeholder">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="profile-email">{user.email}</p>
                  </div>

                  {successMessage && (
                    <div className="success-message">
                      ✓ {successMessage}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Name</label>
                    {editingName ? (
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="form-input"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <div className="form-value">
                        {user.name}
                        <button
                          className="edit-btn"
                          onClick={() => setEditingName(true)}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <div className="form-value">
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="form-hint">Contact admin to change your role</p>
                  </div>

                  <div className="form-group">
                    <label>Member Since</label>
                    <div className="form-value">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Last Login</label>
                    <div className="form-value">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </>
              ) : (
                <AdminPanel isModal={true} />
              )}
            </div>
            
            {activeTab === 'profile' && (
              <div className="modal-footer">
                <button className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
                {editingName && (
                  <button
                    className="save-btn"
                    onClick={handleSaveProfile}
                    disabled={saving || !newName.trim()}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
