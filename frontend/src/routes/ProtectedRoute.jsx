import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

/**
 * ProtectedRoute Component - Higher-order component for route protection
 * Ensures user is authenticated and has required role(s) before accessing route
 */
const ProtectedRoute = ({
  children,
  requiredRoles = [],
  redirectTo = '/'
}) => {
  const { user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check role requirements if specified
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => user.role === role);
    if (!hasRequiredRole) {
      // Redirect to home if user doesn't have required role
      return <Navigate to="/home" replace />;
    }
  }

  // User is authenticated and has required role(s)
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  redirectTo: PropTypes.string
};

export default ProtectedRoute;