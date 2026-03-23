import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import SelectRole from './pages/SelectRole';
import AdminPanel from './pages/AdminPanel';

// Basic protected route - requires authentication only
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Route that requires role to be selected (not pending)
const RoleSelectionRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If role is pending, redirect to role selection
  if (user.rolePending) {
    return <Navigate to="/select-role" replace />;
  }

  return children;
};

// Role-based protected route - requires specific role(s)
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user's role is in allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Role selection page - accessible after OAuth login */}
      <Route 
        path="/select-role" 
        element={
          <ProtectedRoute>
            <SelectRole />
          </ProtectedRoute>
        } 
      />
      
      {/* Home - requires role to be selected */}
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <RoleSelectionRoute>
              <Home />
            </RoleSelectionRoute>
          </ProtectedRoute>
        } 
      />
      
      {/* Admin-only routes */}
      <Route 
        path="/admin/*" 
        element={
          <RoleProtectedRoute allowedRoles={['ADMIN']}>
            <AdminPanel />
          </RoleProtectedRoute>
        } 
      />
      {/* Technician-only routes */}
      <Route 
        path="/technician/*" 
        element={
          <RoleProtectedRoute allowedRoles={['TECHNICIAN']}>
            <div>Technician Dashboard (Coming Soon)</div>
          </RoleProtectedRoute>
        } 
      />
      {/* Staff/Admin routes */}
      <Route 
        path="/staff/*" 
        element={
          <RoleProtectedRoute allowedRoles={['STAFFMEMBER', 'ADMIN']}>
            <div>Staff Portal (Coming Soon)</div>
          </RoleProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
