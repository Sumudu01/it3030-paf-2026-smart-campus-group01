import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './PermissionsPanel.css';

const PermissionsPanel = () => {
  const { getAllUsers, grantPermissions, revokePermissions, grantAllPermissions, getAllPermissions } = useAuth();
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

  const handleGrantAllPermissions = async (email) => {
    try {
      await grantAllPermissions(email);
      await loadUsers();
      setError('');
    } catch (err) {
      setError('Failed to grant all permissions');
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

  if (loading) {
    return <div className="permissions-loading">Loading users...</div>;
  }

  return (
    <div className="permissions-panel">
      <h3>User Permissions Management</h3>

      {error && <div className="error-message">{error}</div>}

      <div className="permissions-grid">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-info">
              <h4>{user.name || 'N/A'}</h4>
              <p>{user.email}</p>
              <span className={`role-badge role-${user.role?.toLowerCase()}`}>{user.role}</span>
            </div>

            <div className="permissions-info">
              {user.hasAllPermissions ? (
                <span className="all-permissions">All Permissions Granted</span>
              ) : (
                <div className="permissions-count">
                  {user.permissions?.length || 0} permissions
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button
                className="btn-manage"
                onClick={() => openPermissionsModal(user)}
              >
                Manage Permissions
              </button>
              {!user.hasAllPermissions && (
                <button
                  className="btn-grant-all"
                  onClick={() => handleGrantAllPermissions(user.email)}
                  title="Grant All Permissions"
                >
                  Grant All
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showPermissionsModal && (
        <div className="modal-overlay">
          <div className="permissions-modal">
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
              <button className="btn-save" onClick={handleSavePermissions}>
                Save Changes
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

export default PermissionsPanel;