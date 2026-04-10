import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PermissionsManagement from './PermissionsManagement';
import './AdminPanel.css';

const AdminPanel = ({ isModal = false }) => {
  const { user, getAllUsers, updateUserRole, grantAllPermissions, setUserEnabled, deleteUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    loadUsers();
  }, []);

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





  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'TECHNICIAN': return 'badge-technician';
      case 'STAFFMEMBER': return 'badge-staff';
      default: return 'badge-student';
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading admin panel...</div>;
  }

  return (
    <div className={`admin-panel ${isModal ? 'modal-view' : ''}`}>
      {!isModal && <h1>Admin Panel - User Management</h1>}

      {error && <div className="error-message">{error}</div>}
      
      <div className="admin-info">
        <p>Logged in as: <strong>{user?.email}</strong></p>
        <p>Role: <span className={getRoleBadgeClass(user?.role)}>{user?.role}</span></p>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
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
                      Grant all
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteUser(u.email)}
                      title="Delete User"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Management Section */}
      <div className="admin-permissions-section">
        <div className="admin-section-header">
          <h2>User Permissions Management</h2>
          <p>Grant and revoke permissions with clear on/off controls.</p>
        </div>

        <div className="admin-permissions-management-container">
          <PermissionsManagement />
        </div>
      </div>


    </div>
  );
};

export default AdminPanel;
