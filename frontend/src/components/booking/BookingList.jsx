import PropTypes from 'prop-types';

/**
 * BookingList Component - Reusable component for displaying a list of bookings
 * Used for admin views (pending bookings, all bookings) with filtering capabilities
 */
const BookingList = ({
  bookings,
  title,
  showUserInfo = false,
  showActions = false,
  onApprove,
  onReject,
  loading = false,
  emptyMessage = 'No bookings found'
}) => {
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

  const handleApprove = (bookingId) => {
    if (onApprove) {
      onApprove(bookingId);
    }
  };

  const handleReject = (bookingId) => {
    if (onReject) {
      onReject(bookingId);
    }
  };

  if (loading) {
    return (
      <div className="booking-list-container">
        <h3>{title}</h3>
        <div className="loading">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="booking-list-container">
      <h3>{title} ({bookings.length})</h3>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Resource</th>
                {showUserInfo && <th>User</th>}
                <th>Title</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Description</th>
                {showActions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => {
                const start = formatDateTime(booking.startDateTime);
                const end = formatDateTime(booking.endDateTime);

                return (
                  <tr key={booking.id}>
                    <td>
                      <span className={`status-badge ${getStatusClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div className="resource-cell">
                        <strong>{booking.resource?.name || 'Unknown'}</strong>
                        {booking.resource?.description && (
                          <div className="resource-description">
                            {booking.resource.description}
                          </div>
                        )}
                      </div>
                    </td>
                    {showUserInfo && (
                      <td>
                        <div className="user-info">
                          {booking.user?.name || booking.user?.email || 'Unknown'}
                        </div>
                      </td>
                    )}
                    <td>{booking.title || '-'}</td>
                    <td>
                      <div className="datetime-cell">
                        <div>{start.date}</div>
                        <div>{start.time}</div>
                      </div>
                    </td>
                    <td>
                      <div className="datetime-cell">
                        <div>{end.date}</div>
                        <div>{end.time}</div>
                      </div>
                    </td>
                    <td>
                      <div className="description-cell">
                        {booking.description || '-'}
                        {booking.expectedAttendees && (
                          <div className="attendees-info">
                            Attendees: {booking.expectedAttendees}
                          </div>
                        )}
                      </div>
                    </td>
                    {showActions && (
                      <td>
                        <div className="admin-actions">
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                className="btn btn-primary btn-small"
                                onClick={() => handleApprove(booking.id)}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger btn-small"
                                onClick={() => handleReject(booking.id)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

BookingList.propTypes = {
  bookings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      resource: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string
      }),
      user: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string
      }),
      title: PropTypes.string,
      startDateTime: PropTypes.string.isRequired,
      endDateTime: PropTypes.string.isRequired,
      description: PropTypes.string,
      expectedAttendees: PropTypes.number,
      rejectReason: PropTypes.string
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  showUserInfo: PropTypes.bool,
  showActions: PropTypes.bool,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string
};

export default BookingList;