import { bookingAPI } from '../services/api';

/**
 * Booking Service - Centralized service for all booking-related API operations
 * Provides a clean interface for booking CRUD operations and admin functions
 */

class BookingService {
  /**
   * Get available resources for booking
   * @returns {Promise} API response with resources array
   */
  async getResources() {
    try {
      const response = await bookingAPI.getResources();
      return response;
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  }

  /**
   * Create a new booking request
   * @param {Object} bookingData - Booking data object
   * @param {number} bookingData.resourceId - Resource ID
   * @param {string} bookingData.title - Booking title/purpose
   * @param {string} bookingData.startDateTime - Start date/time in ISO format
   * @param {string} bookingData.endDateTime - End date/time in ISO format
   * @param {string} bookingData.description - Optional description
   * @param {number} bookingData.expectedAttendees - Optional expected attendees count
   * @returns {Promise} API response
   */
  async createBooking(bookingData) {
    try {
      // Validate required fields
      if (!bookingData.resourceId || !bookingData.startDateTime || !bookingData.endDateTime) {
        throw new Error('Missing required fields: resourceId, startDateTime, endDateTime');
      }

      // Validate date/time logic
      const startTime = new Date(bookingData.startDateTime);
      const endTime = new Date(bookingData.endDateTime);
      const now = new Date();

      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }

      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }

      const response = await bookingAPI.createBooking(bookingData);
      return response;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Get current user's bookings
   * @returns {Promise} API response with user's bookings array
   */
  async getMyBookings() {
    try {
      const response = await bookingAPI.getMyBookings();
      return response;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking (USER role)
   * @param {number} bookingId - ID of the booking to cancel
   * @returns {Promise} API response
   */
  async cancelBooking(bookingId) {
    try {
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }

      const response = await bookingAPI.cancelBooking(bookingId);
      return response;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Get pending bookings for admin review (ADMIN/STAFF roles)
   * @returns {Promise} API response with pending bookings array
   */
  async getPendingBookings() {
    try {
      const response = await bookingAPI.getPendingBookings();
      return response;
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      throw error;
    }
  }

  /**
   * Get all bookings for admin view (ADMIN/STAFF roles)
   * @returns {Promise} API response with all bookings array
   */
  async getAllBookings() {
    try {
      const response = await bookingAPI.getAllBookings();
      return response;
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      throw error;
    }
  }

  /**
   * Approve a booking request (ADMIN/STAFF roles)
   * @param {number} bookingId - ID of the booking to approve
   * @param {string} reason - Optional approval reason
   * @returns {Promise} API response
   */
  async approveBooking(bookingId, reason = '') {
    try {
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }

      const response = await bookingAPI.approveBooking(bookingId, reason);
      return response;
    } catch (error) {
      console.error('Error approving booking:', error);
      throw error;
    }
  }

  /**
   * Reject a booking request (ADMIN/STAFF roles)
   * @param {number} bookingId - ID of the booking to reject
   * @param {string} reason - Rejection reason (required)
   * @returns {Promise} API response
   */
  async rejectBooking(bookingId, reason) {
    try {
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }

      if (!reason || !reason.trim()) {
        throw new Error('Rejection reason is required');
      }

      const response = await bookingAPI.rejectBooking(bookingId, reason);
      return response;
    } catch (error) {
      console.error('Error rejecting booking:', error);
      throw error;
    }
  }

  /**
   * Get bookings by status filter
   * @param {string} status - Status to filter by (PENDING, APPROVED, REJECTED, CANCELLED)
   * @returns {Promise} API response with filtered bookings
   */
  async getBookingsByStatus(status) {
    try {
      const response = await this.getAllBookings();
      const filteredBookings = response.data.bookings.filter(
        booking => booking.status === status
      );

      return {
        ...response,
        data: {
          ...response.data,
          bookings: filteredBookings
        }
      };
    } catch (error) {
      console.error('Error fetching bookings by status:', error);
      throw error;
    }
  }

  /**
   * Get bookings by resource type
   * @param {string} resourceType - Resource type to filter by (ROOM, LAB, EQUIPMENT)
   * @returns {Promise} API response with filtered bookings
   */
  async getBookingsByResourceType(resourceType) {
    try {
      const response = await this.getAllBookings();
      const filteredBookings = response.data.bookings.filter(
        booking => booking.resource?.type === resourceType
      );

      return {
        ...response,
        data: {
          ...response.data,
          bookings: filteredBookings
        }
      };
    } catch (error) {
      console.error('Error fetching bookings by resource type:', error);
      throw error;
    }
  }

  /**
   * Search bookings by title or description
   * @param {string} searchTerm - Term to search for
   * @returns {Promise} API response with filtered bookings
   */
  async searchBookings(searchTerm) {
    try {
      const response = await this.getAllBookings();
      const searchLower = searchTerm.toLowerCase();

      const filteredBookings = response.data.bookings.filter(booking =>
        booking.title?.toLowerCase().includes(searchLower) ||
        booking.description?.toLowerCase().includes(searchLower) ||
        booking.resource?.name?.toLowerCase().includes(searchLower)
      );

      return {
        ...response,
        data: {
          ...response.data,
          bookings: filteredBookings
        }
      };
    } catch (error) {
      console.error('Error searching bookings:', error);
      throw error;
    }
  }
}

// Export singleton instance
const bookingService = new BookingService();
export default bookingService;