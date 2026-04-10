import { useState } from 'react';
import PropTypes from 'prop-types';
import bookingService from '../../services/bookingService';

/**
 * BookingForm Component - Handles creation of new booking requests
 * Used by USER role to create bookings for resources
 */
const BookingForm = ({ resources, onBookingCreated, onError }) => {
  const [formData, setFormData] = useState({
    resourceId: '',
    title: '',
    startDateTime: '',
    endDateTime: '',
    description: '',
    expectedAttendees: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const validateForm = () => {
    if (!formData.resourceId) {
      setValidationError('Please select a resource');
      return false;
    }

    if (!formData.startDateTime || !formData.endDateTime) {
      setValidationError('Please select start and end date/time');
      return false;
    }

    const startTime = new Date(formData.startDateTime);
    const endTime = new Date(formData.endDateTime);
    const now = new Date();

    if (startTime <= now) {
      setValidationError('Start time must be in the future');
      return false;
    }

    if (endTime <= startTime) {
      setValidationError('End time must be after start time');
      return false;
    }

    // Check if resource requires attendees and validate
    const selectedResource = resources.find(r => r.id.toString() === formData.resourceId.toString());
    if (selectedResource?.requiresAttendees && (!formData.expectedAttendees || formData.expectedAttendees <= 0)) {
      setValidationError('Expected number of attendees is required for this resource');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const bookingData = {
        ...formData,
        resourceId: parseInt(formData.resourceId),
        expectedAttendees: formData.expectedAttendees ? parseInt(formData.expectedAttendees) : null
      };

      await bookingService.createBooking(bookingData);

      // Reset form
      setFormData({
        resourceId: '',
        title: '',
        startDateTime: '',
        endDateTime: '',
        description: '',
        expectedAttendees: ''
      });

      // Notify parent component
      if (onBookingCreated) {
        onBookingCreated('Booking created successfully!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create booking';
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-form-container">
      <h3>Create New Booking</h3>

      {validationError && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {validationError}
        </div>
      )}

      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Resource *</label>
          <select
            name="resourceId"
            value={formData.resourceId}
            onChange={handleInputChange}
            className="form-select"
            disabled={submitting}
            required
          >
            <option value="">Select a resource</option>
            {resources.map(resource => (
              <option key={resource.id} value={resource.id}>
                {resource.name} - {resource.description}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Purpose/Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="form-input"
            placeholder="e.g. Team Meeting, Study Session"
            disabled={submitting}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date & Time *</label>
            <input
              type="datetime-local"
              name="startDateTime"
              value={formData.startDateTime}
              onChange={handleInputChange}
              className="form-input"
              disabled={submitting}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date & Time *</label>
            <input
              type="datetime-local"
              name="endDateTime"
              value={formData.endDateTime}
              onChange={handleInputChange}
              className="form-input"
              disabled={submitting}
              required
            />
          </div>
        </div>

        {formData.resourceId && resources.find(r => r.id.toString() === formData.resourceId.toString())?.requiresAttendees && (
          <div className="form-group">
            <label className="form-label">Expected Number of Attendees *</label>
            <input
              type="number"
              name="expectedAttendees"
              value={formData.expectedAttendees}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Number of people attending"
              min="1"
              disabled={submitting}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="form-textarea"
            rows="4"
            placeholder="Additional details about your booking..."
            disabled={submitting}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Creating Booking...' : 'Create Booking'}
        </button>
      </form>
    </div>
  );
};

BookingForm.propTypes = {
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      requiresAttendees: PropTypes.bool
    })
  ).isRequired,
  onBookingCreated: PropTypes.func,
  onError: PropTypes.func
};

export default BookingForm;