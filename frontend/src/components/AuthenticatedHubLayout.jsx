import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HubNavbar } from './HubNavbar';

/**
 * Full-page shell with the same hub header used on /home, for role-specific routes.
 */
export function AuthenticatedHubLayout({ children }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="home-container">
      <HubNavbar
        centerSlot={
          <button type="button" className="nav-link-btn" onClick={() => navigate('/home')}>
            Hub home
          </button>
        }
        onEditProfile={() => navigate('/home')}
        onOpenAdminPanel={user?.role === 'ADMIN' ? () => navigate('/home') : undefined}
      />
      <div className="content">{children}</div>
    </div>
  );
}
