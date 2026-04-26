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
  const [searchTerm, setSearchTerm] = useState('');

  const permissionLabels = {
    // User management
    USER_READ: 'View Users',
    USER_WRITE: 'Create/Edit Users',
    USER_DELETE: 'Delete Users',
    USER_ADMIN: 'System Admin Access',
    // Role management
    ROLE_READ: 'View Role Assignments',
    ROLE_WRITE: 'Change User Roles',
    // Resource Management
    RESOURCE_READ: 'View Campus Resources',
    RESOURCE_WRITE: 'Manage Resources',
    RESOURCE_DELETE: 'Remove Resources',
    RESOURCE_MAINTENANCE: 'Manage Maintenance',
    // Booking Management
    BOOKING_READ: 'View Bookings',
    BOOKING_WRITE: 'Create Bookings',
    BOOKING_APPROVE: 'Approve/Reject Bookings',
    BOOKING_DELETE: 'Cancel Bookings',
    // Ticket Management
    TICKET_READ: 'View Incident Tickets',
    TICKET_WRITE: 'Report Incidents',
    TICKET_ASSIGN: 'Assign Technicians',
    TICKET_COMMENT: 'Add Ticket Comments',
    TICKET_RESOLVE: 'Resolve/Close Tickets',
    // Notifications
    NOTIFICATION_READ: 'View Notifications',
    NOTIFICATION_CLEAR: 'Clear Notifications'
  };

  const getPermissionCategory = (perm) => {
    if (perm.startsWith('USER_')) return 'User Control';
    if (perm.startsWith('ROLE_')) return 'Role Access';
    if (perm.startsWith('RESOURCE_')) return 'Resources';
    if (perm.startsWith('BOOKING_')) return 'Bookings';
    if (perm.startsWith('TICKET_')) return 'Tickets';
    if (perm.startsWith('NOTIFICATION_')) return 'System Alerts';
    return 'General';
  };

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

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    setChanges(prev => {
      const newChanges = { ...prev };
      const originalPerms = selectedUser.permissions || [];
      const isActuallyDifferent = hasPermission 
        ? originalPerms.includes(permission) 
        : !originalPerms.includes(permission);
      
      if (isActuallyDifferent) {
        newChanges[permission] = !hasPermission;
      } else {
        delete newChanges[permission];
      }
      return newChanges;
    });
  };

  const handleGrantAll = () => {
    if (!selectedUser) return;

    const userId = selectedUser.id;
    setUserPermissions(prev => ({
      ...prev,
      [userId]: [...availablePermissions]
    }));

    const newChanges = {};
    const originalPerms = selectedUser.permissions || [];
    availablePermissions.forEach(perm => {
      if (!originalPerms.includes(perm)) {
        newChanges[perm] = true;
      }
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

    const newChanges = {};
    const originalPerms = selectedUser.permissions || [];
    originalPerms.forEach(perm => {
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

      await loadData(); 
      setChanges({});
      setError('');
      alert('Permissions updated successfully!');
    } catch (err) {
      setError('Failed to save permissions');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelChanges = () => {
    if (!selectedUser) return;

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

  const categorizedPermissions = availablePermissions.reduce((acc, perm) => {
    const cat = getPermissionCategory(perm);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(perm);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="permissions-loading">
        <div className="spinner"></div>
        <p>Loading security protocols...</p>
      </div>
    );
  }

  return (
    <div className="permissions-management">
      <div className="permissions-header-compact">
        <div className="header-text">
          <h2>Security & Access Control</h2>
          <p>Granular access management for campus staff.</p>
        </div>
        <div className="header-search">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="user-search-input-compact"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="permissions-content">
        <div className="users-section">
          <div className="section-title-row">
            <h3>Staff List</h3>
            <span className="user-count-badge">{filteredUsers.length} users</span>
          </div>
          <div className="users-list">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                onClick={() => handleUserSelect(user)}
              >
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
                <div className="user-stats">
                  {user.hasAllPermissions ? (
                    <span className="all-permissions">Full Access</span>
                  ) : (
                    <span className="permissions-count">
                      {(user.permissions?.length || 0)} perms
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="no-users-found">No users match "{searchTerm}"</div>
            )}
          </div>
        </div>

        <div className="permissions-section">
          {selectedUser ? (
            <>
              <div className="permissions-header">
                <div className="selected-user-info">
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="bulk-actions">
                  <button className="btn-grant-all" onClick={handleGrantAll} disabled={saving}>
                    Grant All
                  </button>
                  <button className="btn-revoke-all" onClick={handleRevokeAll} disabled={saving}>
                    Revoke All
                  </button>
                </div>
              </div>

              <div className="permissions-grid">
                {Object.entries(categorizedPermissions).map(([category, perms]) => (
                  <div key={category} className="permission-category-group">
                    <h4 className="category-title">{category}</h4>
                    <div className="category-items">
                      {perms.map(permission => {
                        const currentPerms = userPermissions[selectedUser.id] || [];
                        const hasPermission = currentPerms.includes(permission);
                        const isChanged = changes[permission] !== undefined;

                        return (
                          <div
                            key={permission}
                            className={`permission-item ${hasPermission ? 'granted' : ''} ${isChanged ? 'changed' : ''}`}
                          >
                            <div className="permission-info">
                              <span className="permission-name">
                                {permissionLabels[permission] || permission.replace(/_/g, ' ')}
                              </span>
                              <span className="permission-key">{permission}</span>
                              {isChanged && (
                                <span className={`change-indicator ${changes[permission] ? 'granting' : 'revoking'}`}>
                                  {changes[permission] ? 'Grant' : 'Revoke'}
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
                  </div>
                ))}
              </div>

              <div className="permissions-actions">
                <div className="changes-summary">
                  {Object.keys(changes).length > 0 ? (
                    <span className="changes-count">
                      ⚡ {Object.keys(changes).length} pending changes
                    </span>
                  ) : (
                    <span className="no-changes">No changes pending</span>
                  )}
                </div>
                <div className="action-buttons">
                  <button className="btn-cancel" onClick={handleCancelChanges} disabled={saving || Object.keys(changes).length === 0}>
                    Reset
                  </button>
                  <button className="btn-save" onClick={handleSaveChanges} disabled={saving || Object.keys(changes).length === 0}>
                    {saving ? 'Saving...' : 'Apply Changes'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🛡️</div>
              <h3>Select a User</h3>
              <p>Choose a user from the list to view and manage their security permissions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionsManagement;