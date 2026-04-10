import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, bookingAPI } from '../services/api';
import AdminPanel from './AdminPanel';
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
      setBookings(result.bookings || []);
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

      {/* Main Content */}
      <main className="main-content">
        {/* Main Tabs */}
        <div className="main-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            Bookings
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="welcome-section">
              <h2>Welcome back, {user.name}!</h2>
              <p>Manage your bookings and campus resources.</p>
            </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={() => document.querySelector('.booking-form').scrollIntoView()}>
              📅 Create Booking
            </button>
            <a href="/bookings" className="action-btn booking">📅 My Bookings</a>
            {user.role === 'ADMIN' && (
              <button className="action-btn admin" onClick={handleOpenAdminPanel}>
                ⚙️ Admin Panel
              </button>
            )}
          </div>
        </div>

        {/* New Booking Section */}
        <div className="booking-section">
          <div className="booking-card">
            <div className="card-header">
              <h3 className="card-title">📅 Quick Booking</h3>
            </div>
            {bookingError && <div className="error-message">{bookingError}</div>}
            {bookingSuccess && <div className="success-message">{bookingSuccess}</div>}

            {/* Quick Booking Form */}
            <form className="booking-form" onSubmit={handleQuickBooking}>
              <div className="form-group">
                <label className="form-label">Resource *</label>
                <select
                  name="resourceId"
                  value={bookingForm.resourceId}
                  onChange={handleBookingFormChange}
                  disabled={bookingLoading || bookingSubmitting}
                >
                  <option value="">Select a resource</option>
                  {bookingResources.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={bookingForm.startDateTime}
                  onChange={handleBookingFormChange}
                  disabled={bookingLoading || bookingSubmitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time *</label>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={bookingForm.endDateTime}
                  onChange={handleBookingFormChange}
                  disabled={bookingLoading || bookingSubmitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  value={bookingForm.title}
                  onChange={handleBookingFormChange}
                  placeholder="Brief title for your booking"
                  disabled={bookingLoading || bookingSubmitting}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={bookingForm.description}
                  onChange={handleBookingFormChange}
                  placeholder="Additional details..."
                  rows="3"
                  disabled={bookingLoading || bookingSubmitting}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={bookingSubmitting || bookingLoading}>
                {bookingSubmitting ? 'Creating...' : 'Book Now'}
              </button>
            </form>

            {/* Recent Bookings */}
            <div className="recent-bookings-header">
              <h4>Your Recent Bookings</h4>
            </div>
            {bookingLoading ? (
              <div className="loading">Loading bookings...</div>
            ) : recentBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>No recent bookings. Create one above!</p>
              </div>
            ) : (
              <div className="recent-bookings-list">
                {recentBookings.map(booking => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-header">
                      <span className={`status-badge ${getStatusClass(booking.status)}`}>
                        {booking.status}
                      </span>
                      <strong>{booking.resource?.name || 'Unknown'}</strong>
                    </div>
                    <div className="booking-details">
                      <p>
                        {new Date(booking.startDateTime).toLocaleDateString()}
                        {new Date(booking.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {' - '}
                        {new Date(booking.endDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      {booking.title && <p><strong>{booking.title}</strong></p>}
                      {booking.description && <p>{booking.description}</p>}
                    </div>
                    {['PENDING', 'APPROVED'].includes(booking.status) && (
                      <div className="booking-actions">
                        <button
                          className="btn-cancel"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="view-all-container">
              <a href="#booking" className="view-all-link" onClick={() => setActiveTab('booking')}>View All Bookings →</a>
            </div>
          </div>
        </div>

        {/* Booking Management Section - for Admin/Staff */}
        {(user.role === 'ADMIN' || user.role === 'STAFFMEMBER') && (
          <div className="booking-management-section">
            <div className="booking-card">
              <div className="card-header">
                <h3 className="card-title">⚙️ Booking Management</h3>
              </div>
              {managementError && <div className="error-message">{managementError}</div>}
              <div className="bookings-table-container">
                <h4>Pending Bookings</h4>
                {managementLoading ? (
                  <div className="loading">Loading bookings...</div>
                ) : bookings.length === 0 ? (
                  <p>No pending bookings to manage.</p>
                ) : (
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>Resource</th>
                        <th>User</th>
                        <th>Title</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(booking => (
                        <tr key={booking.id}>
                          <td>{booking.resource?.name || 'Unknown'}</td>
                          <td>{booking.user?.name || booking.user?.email || 'Unknown'}</td>
                          <td>{booking.title}</td>
                          <td>{new Date(booking.startDateTime).toLocaleString()}</td>
                          <td>{new Date(booking.endDateTime).toLocaleString()}</td>
                          <td>{booking.description || '-'}</td>
                          <td>
                            <div className="booking-actions">
                              <button
                                className="btn-approve"
                                onClick={() => handleApproveBooking(booking.id)}
                              >
                                Approve
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => openRejectModal(booking)}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {showRejectModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Reject Booking</h2>
              <p>Are you sure you want to reject this booking?</p>
              <div className="booking-details">
                <p><strong>Resource:</strong> {selectedBooking?.resource?.name}</p>
                <p><strong>User:</strong> {selectedBooking?.user?.name || selectedBooking?.user?.email}</p>
                <p><strong>Title:</strong> {selectedBooking?.title}</p>
                <p><strong>Time:</strong> {selectedBooking ? new Date(selectedBooking.startDateTime).toLocaleString() : ''}</p>
              </div>
              <div className="form-group">
                <label>Reason for rejection:</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Optional reason..."
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleRejectBooking(selectedBooking.id, rejectReason)}
                >
                  Reject Booking
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {activeTab === 'booking' && (
          <div className="booking-tab-content">
            {/* Booking Sub-tabs */}
            <div className="booking-tabs">
              <button
                className={`tab-btn ${bookingTab === 'my' ? 'active' : ''}`}
                onClick={() => setBookingTab('my')}
              >
                My Bookings
              </button>
              <button
                className={`tab-btn ${bookingTab === 'new' ? 'active' : ''}`}
                onClick={() => setBookingTab('new')}
              >
                New Booking
              </button>
              {(user.role === 'ADMIN' || user.role === 'STAFFMEMBER') && (
                <button
                  className={`tab-btn ${bookingTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setBookingTab('admin')}
                >
                  Admin Dashboard
                </button>
              )}
            </div>

            {/* Booking Tab Content */}
            {bookingTab === 'my' && (
              <div className="booking-section">
                <div className="booking-card">
                  <MyBookings
                    refreshTrigger={bookingRefreshTrigger}
                    onError={handleBookingError}
                    onSuccess={handleBookingSuccess}
                  />
                </div>
              </div>
            )}

            {bookingTab === 'new' && (
              <div className="booking-section">
                <div className="booking-card">
                  <BookingForm
                    resources={bookingResources}
                    onBookingCreated={handleBookingSuccess}
                    onError={handleBookingError}
                  />
                </div>
              </div>
            )}

            {bookingTab === 'admin' && (user.role === 'ADMIN' || user.role === 'STAFFMEMBER') && (
              <div className="booking-section">
                <div className="booking-card">
                  <AdminBookingReview
                    onError={handleBookingError}
                    onSuccess={handleBookingSuccess}
                  />
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      <AdminPanel isModal={true} activeTab={activeTab} />
    </div>
  );
};
export default Home;
