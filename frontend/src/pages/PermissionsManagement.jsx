import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './PermissionsManagement.css';

const PermissionsManagement = () => {
  const {
    getAllUsers,
    grantPermissions,
    revokePermissions,
    grantAllPermissions,
    revokeAllPermissions,
    getAllPermissions
  } = useAuth();

  const [users, setUsers] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [changes, setChanges] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, permissionsData] = await Promise.all([
        getAllUsers(),
        getAllPermissions()
      ]);
      setUsers(usersData);
      setAvailablePermissions(permissionsData);

      // Initialize user permissions state
      const perms = {};
      usersData.forEach(user => {
        perms[user.id] = user.permissions || [];
      });
      setUserPermissions(perms);
      setChanges({});
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setChanges({});
  };

  const handlePermissionToggle = (permission) => {
    if (!selectedUser) return;

    const userId = selectedUser.id;
    const currentPerms = userPermissions[userId] || [];
    const hasPermission = currentPerms.includes(permission);

    setUserPermissions(prev => ({
      ...prev,
      [userId]: hasPermission
        ? prev[userId].filter(p => p !== permission)
        : [...prev[userId], permission]
    }));

    // Track changes
    setChanges(prev => ({
      ...prev,
      [permission]: !hasPermission
    }));
  };

  const handleGrantAll = () => {
    if (!selectedUser) return;

    const userId = selectedUser.id;
    setUserPermissions(prev => ({
      ...prev,
      [userId]: [...availablePermissions]
    }));

    // Mark all permissions as granted
    const newChanges = {};
    availablePermissions.forEach(perm => {
      newChanges[perm] = true;
    });
    setChanges(newChanges);
  };

  const handleRevokeAll = () => {
    if (!selectedUser) return;

    const userId = selectedUser.id;
    setUserPermissions(prev => ({
      ...prev,
      [userId]: []
    }));

    // Mark all permissions as revoked
    const newChanges = {};
    availablePermissions.forEach(perm => {
      newChanges[perm] = false;
    });
    setChanges(newChanges);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser || Object.keys(changes).length === 0) return;

    setSaving(true);
    try {
      const toGrant = [];
      const toRevoke = [];

      Object.entries(changes).forEach(([permission, shouldGrant]) => {
        if (shouldGrant) {
          toGrant.push(permission);
        } else {
          toRevoke.push(permission);
        }
      });

      if (toGrant.length > 0) {
        await grantPermissions(selectedUser.email, toGrant);
      }
      if (toRevoke.length > 0) {
        await revokePermissions(selectedUser.email, toRevoke);
      }

      await loadData(); // Refresh data
      setChanges({});
      setError('');
    } catch (err) {
      setError('Failed to save permissions');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelChanges = () => {
    if (!selectedUser) return;

    // Reset to original permissions
    const originalPerms = selectedUser.permissions || [];
    setUserPermissions(prev => ({
      ...prev,
      [selectedUser.id]: originalPerms
    }));
    setChanges({});
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
    return <div className="permissions-loading">Loading permissions management...</div>;
  }

  return (
    <div className="permissions-management">
      <div className="permissions-header">
        <h2>Manage User Permissions</h2>
        <p>Select a user from the left panel to manage their permissions</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="permissions-content">
        {/* Users List */}
        <div className="users-section">
          <h3>All Users</h3>
          <div className="users-list">
            {users.map(user => (
              <div
                key={user.id}
                className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="user-info">
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.name || 'N/A'}</div>
                    <div className="user-email">{user.email}</div>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="user-stats">
                  {user.hasAllPermissions ? (
                    <span className="all-permissions">All Permissions</span>
                  ) : (
                    <span className="permissions-count">
                      {(user.permissions?.length || 0)} permissions
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Panel */}
        {selectedUser && (
          <div className="permissions-section">
            <div className="permissions-header">
              <h3>Manage Permissions for {selectedUser.name || selectedUser.email}</h3>
              <div className="bulk-actions">
                <button
                  className="btn-grant-all"
                  onClick={handleGrantAll}
                  disabled={saving}
                >
                  Grant All
                </button>
                <button
                  className="btn-revoke-all"
                  onClick={handleRevokeAll}
                  disabled={saving}
                >
                  Revoke All
                </button>
              </div>
            </div>

            <div className="permissions-grid">
              {availablePermissions.map(permission => {
                const currentPerms = userPermissions[selectedUser.id] || [];
                const hasPermission = currentPerms.includes(permission);
                const isChanged = changes[permission] !== undefined;

                return (
                  <div
                    key={permission}
                    className={`permission-item ${hasPermission ? 'granted' : ''} ${isChanged ? 'changed' : ''}`}
                  >
                    <div className="permission-info">
                      <span className="permission-name">{permission}</span>
                      {isChanged && (
                        <span className={`change-indicator ${changes[permission] ? 'granting' : 'revoking'}`}>
                          {changes[permission] ? 'Will Grant' : 'Will Revoke'}
                        </span>
                      )}
                    </div>
                    <label className="permission-toggle">
                      <input
                        type="checkbox"
                        checked={hasPermission}
                        onChange={() => handlePermissionToggle(permission)}
                        disabled={saving}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                );
              })}
            </div>

            {Object.keys(changes).length > 0 && (
              <div className="permissions-actions">
                <div className="changes-summary">
                  <span className="changes-count">
                    {Object.keys(changes).length} permission(s) will be modified
                  </span>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn-cancel"
                    onClick={handleCancelChanges}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleSaveChanges}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionsManagement;