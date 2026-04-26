import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './HubNavbar.css';

function getRoleBadgeClass(role) {
  switch (role) {
    case 'ADMIN':
      return 'role-admin';
    case 'TECHNICIAN':
      return 'role-technician';
    case 'STAFFMEMBER':
      return 'role-staff';
    case 'PENDING':
      return 'role-pending';
    default:
      return 'role-student';
  }
}

/**
 * Same gradient hub header for every authenticated role (admin, staff, technician, student, pending).
 */
export function HubNavbar({ centerSlot = null, onEditProfile, onOpenAdminPanel }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleEditProfile = () => {
    setMenuOpen(false);
    onEditProfile?.();
  };

  const handleOpenAdminPanel = () => {
    setMenuOpen(false);
    onOpenAdminPanel?.();
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L2 8V11C2 15.5 5 19.5 12 21C19 19.5 22 15.5 22 11V8L12 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8V16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 12H16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1>Smart Campus Operations Hub</h1>
      </div>
      <div className="navbar-nav">{centerSlot}</div>
        <div className="user-profile-block">
          <div className="user-text-info">
            <span className="user-name-header">{user.name}</span>
            <span className={`role-badge-header ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
          </div>
          <div className="profile-dropdown">
            <button className="profile-trigger" onClick={() => setMenuOpen((o) => !o)} type="button">
              {user.picture ? (
                <img src={user.picture} alt="Profile" className="profile-img" />
              ) : (
                <div className="profile-placeholder">{user.name?.charAt(0).toUpperCase()}</div>
              )}
            </button>

            {menuOpen && (
              <div className="profile-menu">
                <div className="menu-header">
                  <span className="menu-name">{user.name}</span>
                  <span className="menu-email">{user.email}</span>
                </div>
                <div className="menu-divider" />
                {onEditProfile && (
                  <button className="menu-item" onClick={handleEditProfile} type="button">
                    <span className="menu-icon" aria-hidden>
                      {'\u{1F464}'}
                    </span>
                    Edit Profile
                  </button>
                )}
                {user.role === 'ADMIN' && onOpenAdminPanel && (
                  <button className="menu-item" onClick={handleOpenAdminPanel} type="button">
                    <span className="menu-icon" aria-hidden>
                      {'\u{2699}\u{FE0F}'}
                    </span>
                    Admin Panel
                  </button>
                )}
                <button className="menu-item" onClick={handleLogout} type="button">
                  <span className="menu-icon" aria-hidden>
                    {'\u{1F6AA}'}
                  </span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
    </nav>
  );
}
