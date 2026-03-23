import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, getAllUsers, updateUserRole, grantPermissions, revokePermissions, grantAllPermissions, getAllPermissions, setUserEnabled, deleteUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    loadUsers();
    loadPermissions();
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

  const loadPermissions = async () => {
    try {
      const permissions = await getAllPermissions();
      setAvailablePermissions(permissions);
    } catch (err) {
      console.error('Failed to load permissions', err);
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

  const openPermissionsModal = (user) => {
    setSelectedUser(user);
    setSelectedPermissions(user.permissions || []);
    setShowPermissionsModal(true);
  };

  const handlePermissionToggle = (permission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
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
    <div className="admin-panel">
      <h1>Admin Panel - User Management</h1>
      
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
                  <button 
                    className={`btn-toggle ${u.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => handleToggleUserEnabled(u.email, !u.enabled)}
                  >
                    {u.enabled ? 'Enabled' : 'Disabled'}
                  </button>
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

      {showPermissionsModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Manage Permissions for {selectedUser?.email}</h2>
            <div className="permissions-list">
              {availablePermissions.map(permission => (
                <label key={permission} className="permission-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                  />
                  {permission}
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-save" onClick={handleSavePermissions}>
                Save Permissions
              </button>
              <button className="btn-cancel" onClick={() => setShowPermissionsModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
