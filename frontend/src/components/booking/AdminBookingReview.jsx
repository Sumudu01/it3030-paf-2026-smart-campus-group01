import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BookingList from './BookingList';
import bookingService from '../../services/bookingService';

/**
 * AdminBookingReview Component - Dashboard for admins to review and manage booking requests
 * Includes filtering, approval/rejection actions, and bulk operations
 */
const AdminBookingReview = ({ onError, onSuccess }) => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [filters, setFilters] = useState({
    status: '',
    resourceType: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        bookingService.getPendingBookings(),
        bookingService.getAllBookings()
      ]);

      setPendingBookings(pendingRes.data.bookings || []);
      setAllBookings(allRes.data.bookings || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      if (onError) {
        onError('Failed to load booking data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      await bookingService.approveBooking(bookingId);

      // Update local state immediately
      setPendingBookings(prev => prev.filter(booking => booking.id !== bookingId));
      setAllBookings(prev => prev.map(booking =>
        booking.id === bookingId ? { ...booking, status: 'APPROVED' } : booking
      ));

      if (onSuccess) {
        onSuccess('Booking approved successfully');
      }
    } catch (error) {
      console.error('Failed to approve booking:', error);
      if (onError) {
        onError('Failed to approve booking');
      }
    }
  };

  const handleRejectBooking = async (bookingId, reason) => {
    if (!reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await bookingService.rejectBooking(bookingId, reason);

      // Update local state immediately
      setPendingBookings(prev => prev.filter(booking => booking.id !== bookingId));
      setAllBookings(prev => prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'REJECTED', rejectReason: reason }
          : booking
      ));

      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectReason('');

      if (onSuccess) {
        onSuccess('Booking rejected successfully');
      }
    } catch (error) {
      console.error('Failed to reject booking:', error);
      if (onError) {
        onError('Failed to reject booking');
      }
    }
  };

  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedBooking(null);
    setRejectReason('');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      resourceType: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getFilteredBookings = (bookings) => {
    return bookings.filter(booking => {
      if (filters.status && booking.status !== filters.status) {
        return false;
      }

      if (filters.resourceType && booking.resource?.type !== filters.resourceType) {
        return false;
      }

      if (filters.dateFrom) {
        const bookingDate = new Date(booking.startDateTime).toDateString();
        const filterDate = new Date(filters.dateFrom).toDateString();
        if (bookingDate < filterDate) {
          return false;
        }
      }

      if (filters.dateTo) {
        const bookingDate = new Date(booking.startDateTime).toDateString();
        const filterDate = new Date(filters.dateTo).toDateString();
        if (bookingDate > filterDate) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredPendingBookings = getFilteredBookings(pendingBookings);
  const filteredAllBookings = getFilteredBookings(allBookings);

  return (
    <div className="admin-booking-review">
      <h3>Booking Management Dashboard</h3>

      {/* Filters */}
      <div className="filters-section">
        <h4>Filters</h4>
        <div className="filters-grid">
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label>Resource Type</label>
            <select
              name="resourceType"
              value={filters.resourceType}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="ROOM">Room</option>
              <option value="LAB">Lab</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date From</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-group">
            <label>Date To</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({filteredPendingBookings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Bookings ({filteredAllBookings.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        <BookingList
          bookings={filteredPendingBookings}
          title="Pending Booking Requests"
          showUserInfo={true}
          showActions={true}
          onApprove={handleApproveBooking}
          onReject={openRejectModal}
          loading={loading}
          emptyMessage="No pending bookings to review"
        />
      )}

      {activeTab === 'all' && (
        <BookingList
          bookings={filteredAllBookings}
          title="All Bookings"
          showUserInfo={true}
          showActions={true}
          onApprove={handleApproveBooking}
          onReject={openRejectModal}
          loading={loading}
          emptyMessage="No bookings found"
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedBooking && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reject Booking Request</h3>

            <div className="booking-details">
              <p><strong>Resource:</strong> {selectedBooking.resource?.name}</p>
              <p><strong>User:</strong> {selectedBooking.user?.name || selectedBooking.user?.email}</p>
              <p><strong>Title:</strong> {selectedBooking.title}</p>
              <p><strong>Time:</strong> {new Date(selectedBooking.startDateTime).toLocaleString()}</p>
              <p><strong>Description:</strong> {selectedBooking.description || 'None'}</p>
            </div>

            <div className="form-group">
              <label>Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this booking request..."
                rows="4"
                required
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closeRejectModal}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleRejectBooking(selectedBooking.id, rejectReason)}
                disabled={!rejectReason.trim()}
              >
                Reject Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AdminBookingReview.propTypes = {
  onError: PropTypes.func,
  onSuccess: PropTypes.func
};

export default AdminBookingReview;