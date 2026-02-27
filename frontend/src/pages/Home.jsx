import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user, logout } = useAuth();

  if (!user) {
    window.location.href = '/';
    return null;
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'TECHNICIAN': return 'role-technician';
      case 'STAFFMEMBER': return 'role-staff';
      default: return 'role-student';
    }
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <h1>Smart Campus Operations Hub</h1>
        <div className="user-info">
          {user.picture && <img src={user.picture} alt="Profile" />}
          <span>{user.name}</span>
          <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
            {user.role}
          </span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="content">
        <div className="welcome-card">
          <h2>Welcome, {user.name}!</h2>
          <p>You are successfully logged in to the Smart Campus Operations Hub.</p>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <label>Email</label>
            <span>{user.email}</span>
          </div>
          <div className="info-card">
            <label>Role</label>
            <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
              {user.role}
            </span>
          </div>
          <div className="info-card">
            <label>Session Status</label>
            <span className="status-active">Active</span>
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            {user.role === 'ADMIN' && (
              <button className="action-btn admin">Admin Panel</button>
            )}
            {user.role === 'TECHNICIAN' && (
              <button className="action-btn technician">Technician Dashboard</button>
            )}
            {(user.role === 'STAFFMEMBER' || user.role === 'ADMIN') && (
              <button className="action-btn staff">Staff Portal</button>
            )}
            <button className="action-btn student">My Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
