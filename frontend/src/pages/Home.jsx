import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import AdminPanel from './AdminPanel';
import PermissionsPanel from './PermissionsPanel';

import { authAPI, bookingAPI } from '../services/api';
import BookingForm from '../components/booking/BookingForm';
import MyBookings from '../components/booking/MyBookings';
import BookingList from '../components/booking/BookingList';
import AdminBookingReview from '../components/booking/AdminBookingReview';
import bookingService from '../services/bookingService';

import './Home.css';
import './Booking.css';

const Home = () => {
  const { user, logout, updateProfile, checkAuth, getPendingBookings, approveBooking, rejectBooking } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeModule, setActiveModule] = useState('profile');

  const modules = [
    { id: 'profile', label: 'Profile' },
    { id: 'resources', label: 'Resources' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'notifications', label: 'Notifications' }
  ];

  // Booking section states (simplified for Home overview)
  const [bookingResources, setBookingResources] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingForm, setBookingForm] = useState({
    resourceId: '',
    title: '',
    startDateTime: '',
    endDateTime: '',
    description: ''
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  // Booking management states for admin section
  const [pendingBookings, setPendingBookings] = useState([]);
  const [managementLoading, setManagementLoading] = useState(false);
  const [managementError, setManagementError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Booking tab states
  const [bookingTab, setBookingTab] = useState('my');
  const [bookingRefreshTrigger, setBookingRefreshTrigger] = useState(0);

  if (!user) {
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
    setShowProfileModal(true);
    setShowProfileMenu(false);
    setActiveTab('profile');
  };

  const handleCloseModal = () => {
    setShowProfileModal(false);
    setEditingName(false);
    setSuccessMessage('');
  };

  const handleOpenAdminPanel = () => {
    setShowProfileModal(true);
    setActiveTab('admin');
    setShowProfileMenu(false);
  };

  const loadBookingData = async () => {
    try {
      setBookingLoading(true);
      setBookingError('');
      const [resourcesRes, myBookingsRes] = await Promise.all([
        bookingAPI.getResources(),
        bookingAPI.getMyBookings()
      ]);
      setBookingResources(resourcesRes.data);
      setRecentBookings((myBookingsRes.data.bookings || []).slice(0, 5));
    } catch (err) {
      setBookingError('Failed to load booking data.');
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  const loadPendingBookings = async () => {
    if (user?.role !== 'ADMIN' && user?.role !== 'STAFFMEMBER') return;

    try {
      setManagementLoading(true);
      setManagementError('');
      const result = await getPendingBookings();
      setPendingBookings(result.bookings || []);
    } catch (err) {
      setManagementError('Failed to load pending bookings.');
      console.error(err);
    } finally {
      setManagementLoading(false);
    }
  };



  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingAPI.cancelBooking(bookingId);
      setBookingSuccess('Booking cancelled successfully!');
      loadBookingData();
      setTimeout(() => setBookingSuccess(''), 3000);
    } catch (err) {
      setBookingError('Failed to cancel booking.');
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      await approveBooking(bookingId);
      setBookingSuccess('Booking approved successfully!');
      loadPendingBookings();
      setTimeout(() => setBookingSuccess(''), 3000);
    } catch (err) {
      setManagementError('Failed to approve booking.');
    }
  };

  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setShowRejectModal(true);
  };

  const handleRejectBooking = async (bookingId, reason) => {
    try {
      await rejectBooking(bookingId, reason);
      setBookingSuccess('Booking rejected successfully!');
      setShowRejectModal(false);
      setRejectReason('');
      loadPendingBookings();
      setTimeout(() => setBookingSuccess(''), 3000);
    } catch (err) {
      setManagementError('Failed to reject booking.');
    }
  };

  // Handle booking form changes for quick booking
  const handleBookingFormChange = (e) => {
    setBookingForm({ ...bookingForm, [e.target.name]: e.target.value });
  };

  // Handle quick booking submission
  const handleQuickBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.resourceId || !bookingForm.startDateTime || !bookingForm.endDateTime) {
      setBookingError('Please fill all required fields.');
      return;
    }

    setBookingSubmitting(true);
    setBookingError('');
    try {
      await bookingService.createBooking(bookingForm);
      setBookingSuccess('Booking created successfully!');
      setBookingForm({
        resourceId: '',
        title: '',
        startDateTime: '',
        endDateTime: '',
        description: ''
      });
      loadBookingData(); // Refresh recent bookings
      setTimeout(() => setBookingSuccess(''), 3000);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to create booking.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Handle booking errors and success from components
  const handleBookingError = (errorMessage) => {
    setBookingError(errorMessage);
    setBookingSuccess('');
  };

  const handleBookingSuccess = (successMessage) => {
    setBookingSuccess(successMessage);
    setBookingError('');
    setBookingRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    loadBookingData();
    loadPendingBookings();
  }, [user]);

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="navbar-left">
          <h1>Smart Campus Operations Hub</h1>
        </div>
        <div className="navbar-nav">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              className={`nav-link-btn ${activeModule === module.id ? 'active' : ''}`}
              onClick={() => setActiveModule(module.id)}
            >
              {module.label}
            </button>
          ))}
        </div>
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

      <main className="main-content">
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
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                </div>
                <div className="info-card">
                  <label>Session Status</label>
                  <span className="status-active">Active</span>
                </div>
              </div>
            </>
          ) : (
            <div className="module-header-card">
              <h2>{modules.find((module) => module.id === activeModule)?.label}</h2>
              <p>This section is ready for future implementation.</p>
            </div>
          )}
        </div>
      </main>

      {showProfileModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className={`profile-modal ${activeTab === 'admin' ? 'admin-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {user.role === 'ADMIN' ? (
                <div className="modal-tabs">
                  <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                    Profile
                  </button>
                  <button className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>
                    Permissions
                  </button>
                  <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
                    Admin Panel
                  </button>
                </div>
              ) : (
                <h2>Edit Profile</h2>
              )}
              <button className="close-btn" onClick={handleCloseModal}>x</button>
            </div>

            <div className="modal-body">
              {activeTab === 'profile' ? (
                <>
                  <div className="form-group">
                    <label>Name</label>
                    <div className="form-value">{user.name}</div>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <div className="form-value">{user.email}</div>
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <div className="form-value">{user.role}</div>
                  </div>
                  <div className="form-group">
                    <label>Last Login</label>
                    <div className="form-value">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'N/A'}</div>
                  </div>
                </>
              ) : activeTab === 'permissions' ? (
                <PermissionsPanel />
              ) : (
                <AdminPanel isModal={true} activeTab="admin" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Home;
