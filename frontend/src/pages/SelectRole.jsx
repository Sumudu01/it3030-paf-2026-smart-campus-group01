import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { HubNavbar } from '../components/HubNavbar';
import './SelectRole.css';

const SelectRole = () => {
  const { user, checkAuth } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const roles = [
    {
      value: 'STUDENT',
      label: 'Student',
      description: 'Book facilities, report issues, and receive notifications',
      icon: '\u{1F393}'
    },
    {
      value: 'STAFFMEMBER',
      label: 'Staff Member',
      description: 'Manage bookings, approve requests, and manage resources',
      icon: '\u{1F468}\u{200D}\u{1F3EB}'
    },
    {
      value: 'TECHNICIAN',
      label: 'Technician',
      description: 'Handle maintenance tickets and technical support',
      icon: '\u{1F527}'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authAPI.selectRole(selectedRole);
      setSuccess(true);

      setTimeout(async () => {
        await checkAuth();
        window.location.href = '/home';
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to select role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="select-role-page">
        <HubNavbar />
        <div className="select-role-container">
          <div className="select-role-card">
            <div className="success-animation">
              <div className="checkmark">{'\u2713'}</div>
            </div>
            <h2>Role Selected!</h2>
            <p>Welcome, {user?.name}!</p>
            <p className="redirect-text">Redirecting to home...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="select-role-page">
      <HubNavbar />
      <div className="select-role-container">
        <div className="select-role-card">
          <div className="role-header">
            <h1>Welcome, {user?.name}!</h1>
            <p>Please select your role to continue</p>
          </div>

          {error && (
            <div className="role-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="role-options">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className={`role-option ${selectedRole === role.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  <div className="role-icon">{role.icon}</div>
                  <div className="role-content">
                    <span className="role-label">{role.label}</span>
                    <span className="role-description">{role.description}</span>
                  </div>
                  <div className="role-checkmark">
                    {selectedRole === role.value && '\u2713'}
                  </div>
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="role-submit-btn"
              disabled={loading || !selectedRole}
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </form>

          <div className="role-note">
            <p>Note: ADMIN role must be assigned by an existing administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
