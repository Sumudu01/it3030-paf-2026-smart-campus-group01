import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import bookingService from '../../services/bookingService';

/**
 * MyBookings Component - Displays bookings created by the current user
 * Allows users to view their booking history and cancel active bookings
 */
const MyBookings = ({ refreshTrigger, onError, onSuccess }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    loadBookings();
  }, [refreshTrigger]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingService.getMyBookings();
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      if (onError) {
        onError('Failed to load your bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancelling(bookingId);
    try {
      await bookingService.cancelBooking(bookingId);

      // Update local state immediately for better UX
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'CANCELLED' }
            : booking
        )
      );

      if (onSuccess) {
        onSuccess('Booking cancelled successfully');
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      if (onError) {
        onError('Failed to cancel booking');
      }
    } finally {
      setCancelling(null);
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

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="my-bookings-container">
        <h3>My Bookings</h3>
        <div className="loading">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="my-bookings-container">
      <h3>My Bookings</h3>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h4>No bookings yet</h4>
          <p>You haven't created any bookings. Create your first booking to get started!</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map(booking => {
            const start = formatDateTime(booking.startDateTime);
            const end = formatDateTime(booking.endDateTime);

            return (
              <div key={booking.id} className="booking-item">
                <div className="booking-header">
                  <span className={`status-badge ${getStatusClass(booking.status)}`}>
                    {booking.status}
                  </span>

                  {booking.status === 'REJECTED' && booking.rejectReason && (
                    <div className="rejection-reason">
                      <strong>Rejection Reason:</strong> {booking.rejectReason}
                    </div>
                  )}
                </div>

                <div className="booking-content">
                  <div className="resource-info">
                    <h4>{booking.resource?.name || 'Unknown Resource'}</h4>
                    <p className="resource-description">
                      {booking.resource?.description}
                    </p>
                  </div>

                  <div className="booking-details">
                    <div className="time-info">
                      <div className="date-time">
                        <strong>Start:</strong> {start.date} at {start.time}
                      </div>
                      <div className="date-time">
                        <strong>End:</strong> {end.date} at {end.time}
                      </div>
                    </div>

                    {booking.title && (
                      <div className="booking-title">
                        <strong>Title:</strong> {booking.title}
                      </div>
                    )}

                    {booking.expectedAttendees && (
                      <div className="attendees-info">
                        <strong>Expected Attendees:</strong> {booking.expectedAttendees}
                      </div>
                    )}

                    {booking.description && (
                      <div className="booking-description">
                        <strong>Description:</strong> {booking.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="booking-actions">
                  {['PENDING', 'APPROVED'].includes(booking.status) && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancelling === booking.id}
                    >
                      {cancelling === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

MyBookings.propTypes = {
  refreshTrigger: PropTypes.any,
  onError: PropTypes.func,
  onSuccess: PropTypes.func
};

export default MyBookings;