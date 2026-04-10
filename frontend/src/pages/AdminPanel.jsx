import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const AdminPanel = ({ isModal = false, activeTab = 'admin' }) => {
  const { user, getAllUsers, updateUserRole, grantPermissions, revokePermissions, grantAllPermissions, getAllPermissions, setUserEnabled, deleteUser, getPendingBookings, getAllBookings, approveBooking, rejectBooking } = useAuth();
  const [users, setUsers] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Booking management states
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (activeTab === 'admin') {
      loadUsers();
      loadPermissions();
    } else if (activeTab === 'booking') {
      loadBookings();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const permissions = await getAllPermissions();
      setAvailablePermissions(permissions);
    } catch (err) {
      console.error('Failed to load permissions', err);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingLoading(true);
      const bookingsData = await getPendingBookings();
      setBookings(bookingsData);
      setBookingError('');
    } catch (err) {
      setBookingError('Failed to load bookings');
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      await approveBooking(bookingId);
      setBookingError('');
      await loadBookings(); // Refresh list
    } catch (err) {
      setBookingError('Failed to approve booking');
    }
  };

  const handleRejectBooking = async (bookingId, reason) => {
    try {
      await rejectBooking(bookingId, reason);
      setBookingError('');
      setShowRejectModal(false);
      setRejectReason('');
      await loadBookings(); // Refresh list
    } catch (err) {
      setBookingError('Failed to reject booking');
    }
  };

  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setShowRejectModal(true);
  };

  const handleRoleChange = async (email, newRole) => {
    try {
      await updateUserRole(email, newRole);
      await loadUsers();
      setError('');
    } catch (err) {
      setError('Failed to update role');
    }
  };

  const handleGrantAllPermissions = async (email) => {
    try {
      await grantAllPermissions(email);
      await loadUsers();
      setError('');
    } catch (err) {
      setError('Failed to grant all permissions');
    }
  };

  const handleToggleUserEnabled = async (email, enabled) => {
    try {
      await setUserEnabled(email, enabled);
      await loadUsers();
      setError('');
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm(`Are you sure you want to delete user ${email}?`)) {
      try {
        await deleteUser(email);
        await loadUsers();
        setError('');
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const openPermissionsModal = (user) => {
    setSelectedUser(user);
    setSelectedPermissions([...(user.permissions || [])]);
    setShowPermissionsModal(true);
  };

  const handlePermissionToggle = (permission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  const handleGrantPermission = async (permission) => {
    if (!selectedUser) return;
    try {
      await grantPermissions(selectedUser.email, [permission]);
      await loadUsers();
      // Update local state
      setSelectedPermissions([...selectedPermissions, permission]);
      setError('');
    } catch (err) {
      setError('Failed to grant permission');
    }
  };

  const handleRevokePermission = async (permission) => {
    if (!selectedUser) return;
    try {
      await revokePermissions(selectedUser.email, [permission]);
      await loadUsers();
      // Update local state
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
      setError('');
    } catch (err) {
      setError('Failed to revoke permission');
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    const currentPermissions = selectedUser.permissions || [];
    const toGrant = selectedPermissions.filter(p => !currentPermissions.includes(p));
    const toRevoke = currentPermissions.filter(p => !selectedPermissions.includes(p));

    try {
      if (toGrant.length > 0) {
        await grantPermissions(selectedUser.email, toGrant);
      }
      if (toRevoke.length > 0) {
        await revokePermissions(selectedUser.email, toRevoke);
      }
      await loadUsers();
      setShowPermissionsModal(false);
      setError('');
    } catch (err) {
      setError('Failed to update permissions');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'TECHNICIAN': return 'badge-technician';
      case 'STAFFMEMBER': return 'badge-staff';
      default: return 'badge-student';
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div className={`admin-panel ${isModal ? 'modal-view' : ''}`}>
      {!isModal && (
        <h1>
          {activeTab === 'admin' ? 'Admin Panel - User Management' :
           activeTab === 'booking' ? 'Booking Management' : 'Admin Panel'}
        </h1>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="admin-info">
        <p>Logged in as: <strong>{user?.email}</strong></p>
        <p>Role: <span className={getRoleBadgeClass(user?.role)}>{user?.role}</span></p>
      </div>

      {activeTab === 'admin' ? (
        <div className="users-table-container">
          <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name || 'N/A'}</td>
                <td>{u.email}</td>
                <td>
                  <select 
                    value={u.role} 
                    onChange={(e) => handleRoleChange(u.email, e.target.value)}
                    className={getRoleBadgeClass(u.role)}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="STAFFMEMBER">Staff Member</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td>
                  {u.hasAllPermissions ? (
                    <span className="badge-all-permissions">All Permissions</span>
                  ) : (
                    <button 
                      className="btn-permissions"
                      onClick={() => openPermissionsModal(u)}
                    >
                      {u.permissions?.length || 0} permissions
                    </button>
                  )}
                </td>
                <td>
                  <div className="status-buttons">
                    <button
                      className="btn-enable"
                      onClick={() => handleToggleUserEnabled(u.email, true)}
                      disabled={u.enabled}
                    >
                      Enable
                    </button>
                    <button
                      className="btn-disable"
                      onClick={() => handleToggleUserEnabled(u.email, false)}
                      disabled={!u.enabled}
                    >
                      Disable
                    </button>
                  </div>
                </td>
                <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-grant-all"
                      onClick={() => handleGrantAllPermissions(u.email)}
                      title="Grant All Permissions"
                    >
                      ★
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteUser(u.email)}
                      title="Delete User"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : activeTab === 'booking' ? (
        <div className="bookings-container">
          {bookingLoading ? (
            <div className="booking-loading">Loading bookings...</div>
          ) : bookingError ? (
            <div className="error-message">{bookingError}</div>
          ) : (
            <div className="bookings-table-container">
              <h3>Pending Bookings</h3>
              {bookings.length === 0 ? (
                <p>No pending bookings.</p>
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
          )}
        </div>
      ) : null}

      {activeTab === 'admin' && showPermissionsModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Manage Permissions for {selectedUser?.email}</h2>
            <div className="permissions-list">
              {availablePermissions.map(permission => (
                <div key={permission} className="permission-item">
                  <span className="permission-name">{permission}</span>
                  <div className="permission-buttons">
                    <button
                      className="btn-grant"
                      onClick={() => handleGrantPermission(permission)}
                      disabled={selectedPermissions.includes(permission)}
                    >
                      Grant
                    </button>
                    <button
                      className="btn-revoke"
                      onClick={() => handleRevokePermission(permission)}
                      disabled={!selectedPermissions.includes(permission)}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowPermissionsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'booking' && showRejectModal && (
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
    </div>
  );
};

export default AdminPanel;
