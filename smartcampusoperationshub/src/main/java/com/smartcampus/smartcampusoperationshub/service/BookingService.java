package com.smartcampus.smartcampusoperationshub.service;

import com.smartcampus.smartcampusoperationshub.model.*;
import com.smartcampus.smartcampusoperationshub.repository.BookingRepository;
import com.smartcampus.smartcampusoperationshub.repository.ResourceRepository;
import com.smartcampus.smartcampusoperationshub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Validated
@Transactional
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private ResourceRepository resourceRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private Validator validator;

    /**
     * FR7: Create booking request
     */
    public Map<String, Object> createBooking(@Valid Booking bookingRequest, Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        // Get authenticated user
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            response.put("error", "User not found");
            response.put("status", HttpStatus.NOT_FOUND.value());
            return response;
        }
        User user = userOpt.get();
        
        // Validate resource exists and active
        Optional<Resource> resourceOpt = resourceRepository.findById(bookingRequest.getResource().getId());
        if (resourceOpt.isEmpty()) {
            response.put("error", "Resource not found");
            response.put("status", HttpStatus.NOT_FOUND.value());
            return response;
        }
        Resource resource = resourceOpt.get();
        if (!resource.isActive()) {
            response.put("error", "Resource is not active");
            response.put("status", HttpStatus.BAD_REQUEST.value());
            return response;
        }
        
        Booking booking = new Booking(user, resource, 
                                    bookingRequest.getStartTime(), 
                                    bookingRequest.getEndTime(), 
                                    bookingRequest.getPurpose());
        
        // FR8: Bean validation
        Set<ConstraintViolation<Booking>> violations = validator.validate(booking);
        if (!violations.isEmpty()) {
            response.put("error", "Validation failed");
            response.put("violations", violations.stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toList()));
            response.put("status", HttpStatus.BAD_REQUEST.value());
            return response;
        }
        
        // FR8: Business validation
        if (!booking.hasValidTimeRange()) {
            response.put("error", "Invalid time range: End must be at least 1 hour after start");
            response.put("status", HttpStatus.BAD_REQUEST.value());
            return response;
        }
        
        // Check for overlapping bookings (FR8)
        List<Booking> overlaps = bookingRepository.findOverlappingBookings(
            resource.getId(), booking.getStartTime(), booking.getEndTime());
        if (!overlaps.isEmpty()) {
            response.put("error", "Resource already booked for this time period");
            response.put("conflicts", overlaps.stream()
                .map(b -> Map.of("id", b.getId(), "start", b.getStartTime(), "end", b.getEndTime()))
                .collect(Collectors.toList()));
            response.put("status", HttpStatus.CONFLICT.value());
            return response;
        }
        
        // Save booking (status PENDING)
        Booking saved = bookingRepository.save(booking);
        response.put("message", "Booking request created successfully");
        response.put("booking", toDto(saved));
        response.put("status", HttpStatus.CREATED.value());
        return response;
    }

    /**
     * FR10: Admin approve booking
     */
    public Map<String, Object> approveBooking(Long bookingId, Long adminId, String reason) {
        Map<String, Object> response = new HashMap<>();
        Optional<User> adminOpt = userRepository.findById(adminId);
        if (adminOpt.isEmpty()) {
            response.put("error", "Admin not found");
            response.put("status", HttpStatus.NOT_FOUND.value());
            return response;
        }
        
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            response.put("error", "Booking not found");
            response.put("status", HttpStatus.NOT_FOUND.value());
            return response;
        }
        
        Booking booking = bookingOpt.get();
        if (booking.getStatus() != BookingStatus.PENDING) {
            response.put("error", "Only PENDING bookings can be approved");
            response.put("currentStatus", booking.getStatus());
            response.put("status", HttpStatus.BAD_REQUEST.value());
            return response;
        }
        
        // Update status and approver
        booking.setStatus(BookingStatus.APPROVED);
        booking.setApprovedBy(adminOpt.get());
        bookingRepository.save(booking);
        
        response.put("message", "Booking approved successfully");
        response.put("booking", toDto(booking));
        response.put("status", HttpStatus.OK.value());
        return response;
    }

    /**
     * FR10: Admin reject booking
     */
    public Map<String, Object> rejectBooking(Long bookingId, Long adminId, String reason) {
        Map<String, Object> response = new HashMap<>();
        Optional<User> adminOpt = userRepository.findById(adminId);
        if (adminOpt.isEmpty()) {
            response.put("error", "Admin not found");
            response.put("status", HttpStatus.NOT_FOUND.value());
            return response;
        }
        
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            response.put("error", "Booking not found");
            response.put("status", HttpStatus.NOT_FOUND.value());
            return response;
        }
        
        Booking booking = bookingOpt.get();
        if (booking.getStatus() != BookingStatus.PENDING) {
            response.put("error", "Only PENDING bookings can be rejected");
            response.put("currentStatus", booking.getStatus());
            response.put("status", HttpStatus.BAD_REQUEST.value());
            return response;
        }
        
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        bookingRepository.save(booking);
        
        response.put("message", "Booking rejected");
        response.put("booking", toDto(booking));
        response.put("status", HttpStatus.OK.value());
        return response;
    }

    /**
     * FR11: User cancel own booking
     */
    public Map<String, Object> cancelBooking(Long bookingId, Long userId) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
        if (bookingOpt.isEmpty()) {
            response.put("error", "Booking not found");
            response.put("status", HttpStatus.NOT_FOUND.value());
            return response;
        }
        
        Booking booking = bookingOpt.get();
        if (!booking.getUser().getId().equals(userId)) {
            response.put("error", "Can only cancel your own bookings");
            response.put("status", HttpStatus.FORBIDDEN.value());
            return response;
        }
        
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.REJECTED) {
            response.put("error", "Booking already cancelled or rejected");
            response.put("status", HttpStatus.BAD_REQUEST.value());
            return response;
        }
        
        if (LocalDateTime.now().isAfter(booking.getStartTime().minusHours(24))) {
            response.put("error", "Cannot cancel booking less than 24 hours before start time");
            response.put("status", HttpStatus.BAD_REQUEST.value());
            return response;
        }
        
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        
        response.put("message", "Booking cancelled successfully");
        response.put("booking", toDto(booking));
        response.put("status", HttpStatus.OK.value());
        return response;
    }

    /**
     * FR11: Get user bookings
     */
    public Map<String, Object> getUserBookings(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "User not found");
            response.put("status", HttpStatus.NOT_FOUND.value());
            return response;
        }
        
        List<Booking> bookings = bookingRepository.findByUserIdOrderByStartTimeDesc(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("bookings", bookings.stream().map(this::toDto).collect(Collectors.toList()));
        response.put("status", HttpStatus.OK.value());
        return response;
    }

    /**
     * FR12: Admin get all/pending bookings
     */
    public Map<String, Object> getPendingBookings() {
        List<Booking> pending = bookingRepository.findByStatusOrderByCreatedAtDesc(BookingStatus.PENDING);
        Map<String, Object> response = new HashMap<>();
        response.put("pendingBookings", pending.stream().map(this::toDto).collect(Collectors.toList()));
        response.put("totalPending", pending.size());
        response.put("status", HttpStatus.OK.value());
        return response;
    }

    public Map<String, Object> getAllBookings() {
        List<Booking> all = bookingRepository.findAllByOrderByStartTimeDesc();
        Map<String, Object> response = new HashMap<>();
        response.put("bookings", all.stream().map(this::toDto).collect(Collectors.toList()));
        response.put("total", all.size());
        response.put("status", HttpStatus.OK.value());
        return response;
    }

    // Utility: Convert Booking to DTO (hide lazy relations)
    private Map<String, Object> toDto(Booking booking) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", booking.getId());
        dto.put("resourceId", booking.getResource().getId());
        dto.put("resourceName", booking.getResource().getName());
        dto.put("userId", booking.getUser().getId());
        dto.put("userEmail", booking.getUser().getEmail());
        dto.put("startTime", booking.getStartTime());
        dto.put("endTime", booking.getEndTime());
        dto.put("purpose", booking.getPurpose());
        dto.put("status", booking.getStatus().name());
        dto.put("rejectionReason", booking.getRejectionReason());
        if (booking.getApprovedBy() != null) {
            dto.put("approvedById", booking.getApprovedBy().getId());
        }
        dto.put("createdAt", booking.getCreatedAt());
        dto.put("updatedAt", booking.getUpdatedAt());
        return dto;
    }
}
