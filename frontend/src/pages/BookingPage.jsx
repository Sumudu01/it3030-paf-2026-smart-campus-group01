import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BookingForm from '../components/booking/BookingForm';
import MyBookings from '../components/booking/MyBookings';
import BookingList from '../components/booking/BookingList';
import AdminBookingReview from '../components/booking/AdminBookingReview';
import bookingService from '../services/bookingService';
import './Booking.css';

/**
 * BookingPage Component - Main page for all booking management features
 * Orchestrates different booking views based on user role and selected tab
 */
const BookingPage = () => {
  const { user, hasRole } = useAuth();
  const isAdminOrStaff = hasRole(['ADMIN', 'STAFFMEMBER']);

  const [activeTab, setActiveTab] = useState('my');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load resources on component mount
  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const response = await bookingService.getResources();
      setResources(response.data.resources || []);
    } catch (error) {
      console.error('Failed to load resources:', error);
      setError('Failed to load available resources');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setSuccess(''); // Clear success message
  };

  const handleSuccess = (successMessage) => {
    setSuccess(successMessage);
    setError(''); // Clear error message
    setRefreshTrigger(prev => prev + 1); // Trigger refresh of booking lists
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="booking-card loading">
          <div>Loading booking data...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'new':
        return (
          <div className="booking-card">
            <BookingForm
              resources={resources}
              onBookingCreated={handleSuccess}
              onError={handleError}
            />
          </div>
        );

      case 'my':
        return (
          <div className="booking-card">
            <MyBookings
              refreshTrigger={refreshTrigger}
              onError={handleError}
              onSuccess={handleSuccess}
            />
          </div>
        );

      case 'admin':
        return (
          <div className="booking-card">
            <AdminBookingReview
              onError={handleError}
              onSuccess={handleSuccess}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h1 className="booking-title">Smart Campus Booking System</h1>
        <p className="booking-subtitle">
          Manage your resource bookings efficiently
        </p>

        <div className="booking-tabs">
          <button
            className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            My Bookings
          </button>
          <button
            className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            New Booking
          </button>
          {isAdminOrStaff && (
            <button
              className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="message-container">
          <div className="error-message">
            {error}
            <button className="message-close" onClick={clearMessages}>×</button>
          </div>
        </div>
      )}

      {success && (
        <div className="message-container">
          <div className="success-message">
            {success}
            <button className="message-close" onClick={clearMessages}>×</button>
          </div>
        </div>
      )}

      <div className="booking-content">
        {renderTabContent()}
      </div>

      {/* User Info Footer */}
      <div className="booking-footer">
        <div className="user-info">
          <span>Logged in as: <strong>{user?.name}</strong></span>
          <span className="user-role">Role: {user?.role}</span>
        </div>
        <div className="booking-stats">
          <span>Available Resources: {resources.length}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;