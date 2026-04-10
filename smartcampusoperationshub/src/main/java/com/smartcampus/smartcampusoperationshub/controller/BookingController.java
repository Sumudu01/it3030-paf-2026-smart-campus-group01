package com.smartcampus.smartcampusoperationshub.controller;

import com.smartcampus.smartcampusoperationshub.model.*;
import com.smartcampus.smartcampusoperationshub.service.BookingService;
import com.smartcampus.smartcampusoperationshub.service.CustomOAuth2UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // ==================== USER ENDPOINTS ====================

    /**
     * FR7: Create booking request
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createBooking(
            @Valid @RequestBody Booking bookingRequest,
            Authentication authentication) {
        
        if (!(authentication.getPrincipal() instanceof CustomOAuth2UserPrincipal principal)) {
            return ResponseEntity.status(401).build();
        }
        
        Long userId = principal.getUser().getId();
        Map<String, Object> result = bookingService.createBooking(bookingRequest, userId);
        return ResponseEntity.status((Integer) result.get("status")).body(result);
    }

    /**
     * FR11: Get user's own bookings
     */
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyBookings(Authentication authentication) {
        if (!(authentication.getPrincipal() instanceof CustomOAuth2UserPrincipal principal)) {
            return ResponseEntity.status(401).build();
        }
        
        Long userId = principal.getUser().getId();
        Map<String, Object> result = bookingService.getUserBookings(userId);
        return ResponseEntity.ok(result);
    }

    /**
     * FR11: Cancel own booking
     */
    @DeleteMapping("/{bookingId}")
    public ResponseEntity<Map<String, Object>> cancelBooking(
            @PathVariable Long bookingId,
            Authentication authentication) {
        
        if (!(authentication.getPrincipal() instanceof CustomOAuth2UserPrincipal principal)) {
            return ResponseEntity.status(401).build();
        }
        
        Long userId = principal.getUser().getId();
        Map<String, Object> result = bookingService.cancelBooking(bookingId, userId);
        return ResponseEntity.status((Integer) result.get("status")).body(result);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * FR10, FR12: Get pending bookings (Admin)
     */
    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingBookings(Authentication authentication) {
        // Admin check (will be enforced by SecurityConfig)
        Map<String, Object> result = bookingService.getPendingBookings();
        return ResponseEntity.ok(result);
    }

    /**
     * FR12: Get all bookings (Admin)
     */
    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getAllBookings(Authentication authentication) {
        Map<String, Object> result = bookingService.getAllBookings();
        return ResponseEntity.ok(result);
    }

    /**
     * FR10: Approve booking (Admin)
     */
    @PutMapping("/{bookingId}/approve")
    public ResponseEntity<Map<String, Object>> approveBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false, defaultValue = "") String reason,
            Authentication authentication) {
        
        if (!(authentication.getPrincipal() instanceof CustomOAuth2UserPrincipal principal)) {
            return ResponseEntity.status(401).build();
        }
        
        Long adminId = principal.getUser().getId();
        Map<String, Object> result = bookingService.approveBooking(bookingId, adminId, reason);
        return ResponseEntity.status((Integer) result.get("status")).body(result);
    }

    /**
     * FR10: Reject booking (Admin)
     */
    @PutMapping("/{bookingId}/reject")
    public ResponseEntity<Map<String, Object>> rejectBooking(
            @PathVariable Long bookingId,
            @RequestParam String reason,
            Authentication authentication) {
        
        if (!(authentication.getPrincipal() instanceof CustomOAuth2UserPrincipal principal)) {
            return ResponseEntity.status(401).build();
        }
        
        Long adminId = principal.getUser().getId();
        Map<String, Object> result = bookingService.rejectBooking(bookingId, adminId, reason);
        return ResponseEntity.status((Integer) result.get("status")).body(result);
    }

    // ==================== RESOURCE ENDPOINTS ====================

    /**
     * Get available resources
     */
    @GetMapping("/resources")
    public ResponseEntity<Map<String, Object>> getResources() {
        // This would use ResourceService - stub for now
        Map<String, Object> response = Map.of(
            "resources", java.util.Arrays.asList(
                Map.of("id", 1L, "name", "Meeting Room A", "description", "10 seats"),
                Map.of("id", 2L, "name", "Lab 101", "description", "Computer lab"),
                Map.of("id", 3L, "name", "Auditorium", "description", "100 seats")
            ),
            "message", "Use /api/bookings/resources after ResourceController implemented"
        );
        return ResponseEntity.ok(response);
    }
}

