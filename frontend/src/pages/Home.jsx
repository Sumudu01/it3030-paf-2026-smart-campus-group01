import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HubNavbar } from '../components/HubNavbar';
import { notificationAPI } from '../services/api';
import AdminPanel from './AdminPanel';
import PermissionsPanel from './PermissionsPanel';
import Bookings from './Bookings';
import Tickets from './Tickets';
import Notifications from './Notifications';
import './Home.css';

function formatHubDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

const Home = () => {
  const { user, updateProfile, checkAuth } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeModule, setActiveModule] = useState('profile');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data?.count || 0);
    } catch (e) {
      console.error('Failed to fetch unread count', e);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleBookingCreated = useCallback((booking, apiMessage) => {
    fetchUnreadCount(); // Refresh count immediately
  }, [fetchUnreadCount]);

  const modules = [
    { id: 'profile', label: 'Profile' },
    { id: 'resources', label: 'Resources' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'notifications', label: 'Notifications' }
  ];

  if (!user) {
    return null;
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'TECHNICIAN': return 'role-technician';
      case 'STAFFMEMBER': return 'role-staff';
      case 'PENDING': return 'role-pending';
      default: return 'role-student';
    }
  };

  const handleEditProfile = () => {
    setNewName(user.name);
    setShowProfileModal(true);
    setActiveTab('profile');
    setSuccessMessage('');
  };

  const handleOpenAdminPanel = () => {
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
      <HubNavbar
        centerSlot={
          <>
            {modules.map((module) => (
              <span key={module.id} className="nav-module-wrap">
                <button
                  type="button"
                  className={`nav-link-btn ${activeModule === module.id ? 'active' : ''}`}
                  onClick={() => setActiveModule(module.id)}
                >
                  {module.label}
                </button>
                {module.id === 'notifications' && unreadCount > 0 && (
                  <span className="nav-notify-badge" aria-label={`${unreadCount} notifications`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
            ))}
          </>
        }
        onEditProfile={handleEditProfile}
        onOpenAdminPanel={user.role === 'ADMIN' ? handleOpenAdminPanel : undefined}
      />

      <div className="content">
        {activeModule === 'profile' ? (
          <>
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
              </div>
            </div>

            {user.role === 'ADMIN' && (
              <div className="admin-section">
                <h2>Admin Controls</h2>
                <AdminPanel />
              </div>
            )}
          </>
        ) : activeModule === 'bookings' ? (
          <Bookings onBookingCreated={handleBookingCreated} />
        ) : activeModule === 'notifications' ? (
          <Notifications />
        ) : activeModule === 'tickets' ? (
          <Tickets />
        ) : (
          <>
            <div className="module-header-card">
              <h2>{modules.find((module) => module.id === activeModule)?.label}</h2>
              <p>This section is ready for future implementation.</p>
            </div>

            <div className="module-content-placeholder"></div>
          </>
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
                    className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('permissions')}
                  >
                    Permissions
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
                      {'\u2713'} {successMessage}
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
              ) : activeTab === 'permissions' ? (
                <PermissionsPanel />
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
