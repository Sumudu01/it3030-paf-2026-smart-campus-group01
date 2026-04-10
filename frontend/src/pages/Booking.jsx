import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../services/api';
import './Booking.css';

const Booking = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrStaff = hasRole(['ADMIN', 'STAFFMEMBER']);
  
  const [activeTab, setActiveTab] = useState('my');
  const [resources, setResources] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    resourceId: '',
    title: '',
    startDateTime: '',
    endDateTime: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Status badge class mapper
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  // Load data on mount/tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resourcesRes, myBookingsRes] = await Promise.all([
        bookingAPI.getResources(),
        bookingAPI.getMyBookings()
      ]);
      
      setResources(resourcesRes.data.resources || []);
      setMyBookings(myBookingsRes.data.bookings || []);

      if (isAdminOrStaff) {
        const [pendingRes, allRes] = await Promise.all([
          bookingAPI.getPendingBookings(),
          bookingAPI.getAllBookings()
        ]);
        setPendingBookings(pendingRes.data.bookings || []);
        setAllBookings(allRes.data.bookings || []);
      }
    } catch (err) {
      setError('Failed to load booking data. Please try again.');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.resourceId || !formData.startDateTime || !formData.endDateTime) {
      setError('Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await bookingAPI.createBooking(formData);
      setSuccess('Booking created successfully!');
      setFormData({ resourceId: '', title: '', startDateTime: '', endDateTime: '', description: '' });
      loadData(); // Refresh my bookings
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingAPI.cancelBooking(bookingId);
      setSuccess('Booking cancelled successfully!');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to cancel booking.');
    }
  };

  const handleApprove = async (bookingId, reason) => {
    try {
      await bookingAPI.approveBooking(bookingId, reason);
      setSuccess('Booking approved!');
      loadData();
    } catch (err) {
      setError('Failed to approve booking.');
    }
  };

  const handleReject = async (bookingId, reason) => {
    const inputReason = prompt('Enter rejection reason:', reason || '');
    if (!inputReason) return;
    try {
      await bookingAPI.rejectBooking(bookingId, inputReason);
      setSuccess('Booking rejected.');
      loadData();
    } catch (err) {
      setError('Failed to reject booking.');
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="booking-card loading">
          <div>Loading bookings...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'new':
        return (
          <div className="booking-card">
            <div className="card-header">
              <h3 className="card-title">New Booking</h3>
            </div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Resource *</label>
                <select 
                  name="resourceId" 
                  value={formData.resourceId} 
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select resource</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g. Team Meeting"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Date & Time *</label>
                <input 
                  type="datetime-local" 
                  name="startDateTime" 
                  value={formData.startDateTime} 
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time *</label>
                <input 
                  type="datetime-local" 
                  name="endDateTime" 
                  value={formData.endDateTime} 
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="4"
                  placeholder="Additional details..."
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Booking'}
              </button>
            </form>
          </div>
        );

      case 'my':
        return (
          <div className="booking-card">
            <div className="card-header">
              <h3 className="card-title">My Bookings</h3>
            </div>
            {myBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h4>No bookings yet</h4>
                <p>Create your first booking using the "New Booking" tab.</p>
              </div>
            ) : (
              myBookings.map(booking => (
                <div key={booking.id} className="booking-item">
                  <span className={`status-badge ${getStatusClass(booking.status)}`}>
                    {booking.status}
                  </span>
                  <div className="resource-info">
                    <strong>{booking.resource?.name || 'Unknown'}</strong>
                    <span className="time-info">
                      {new Date(booking.startDateTime).toLocaleString()} - 
                      {new Date(booking.endDateTime).toLocaleString()}
                    </span>
                  </div>
                  {booking.description && <p>{booking.description}</p>}
                  {['PENDING', 'APPROVED'].includes(booking.status) && (
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        );

      case 'pending':
        return (
          <div className="booking-card">
            <div className="card-header">
              <h3 className="card-title">Pending Approvals ({pendingBookings.length})</h3>
            </div>
            {pendingBookings.map(booking => (
              <div key={booking.id} className="booking-item">
                <span className={`status-badge ${getStatusClass(booking.status)}`}>PENDING</span>
                <div className="resource-info">
                  <strong>{booking.resource?.name || 'Unknown'}</strong>
                  <div>{booking.user?.email || 'Unknown'}</div>
                  <span className="time-info">
                    {new Date(booking.startDateTime).toLocaleString()} - 
                    {new Date(booking.endDateTime).toLocaleString()}
                  </span>
                </div>
                <div className="admin-actions">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleApprove(booking.id)}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleReject(booking.id, booking.rejectReason)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'all':
        return (
          <div className="booking-card">
            <div className="card-header">
              <h3 className="card-title">All Bookings ({allBookings.length})</h3>
            </div>
            {allBookings.map(booking => (
              <div key={booking.id} className="booking-item">
                <span className={`status-badge ${getStatusClass(booking.status)}`}>
                  {booking.status}
                </span>
                <div className="resource-info">
                  <strong>{booking.resource?.name || 'Unknown'}</strong>
                  <div>{booking.user?.email || 'Unknown'}</div>
                  <span className="time-info">
                    {new Date(booking.startDateTime).toLocaleString()} - 
                    {new Date(booking.endDateTime).toLocaleString()}
                  </span>
                </div>
                {['PENDING'].includes(booking.status) && isAdminOrStaff && (
                  <div className="admin-actions">
                    <button className="btn btn-primary" onClick={() => handleApprove(booking.id)}>
                      Approve
                    </button>
                    <button className="btn btn-danger" onClick={() => handleReject(booking.id)}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h1 className="booking-title">Bookings</h1>
        <div className="booking-tabs">
          <button 
            className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            My Bookings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            New Booking
          </button>
          {isAdminOrStaff && (
            <>
              <button 
                className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending
              </button>
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
            </>
          )}
        </div>
      </div>
      
      {error && !loading && <div className="error-message">{error}</div>}
      {success && !loading && <div className="success-message">{success}</div>}
      
      <div className="booking-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Booking;
