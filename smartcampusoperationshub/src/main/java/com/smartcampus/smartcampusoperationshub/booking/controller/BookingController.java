package com.smartcampus.smartcampusoperationshub.booking.controller;

import com.smartcampus.smartcampusoperationshub.booking.dto.CreateBookingRequest;
import com.smartcampus.smartcampusoperationshub.booking.dto.DecisionRequest;
import com.smartcampus.smartcampusoperationshub.booking.model.Booking;
import com.smartcampus.smartcampusoperationshub.booking.model.BookingAudit;
import com.smartcampus.smartcampusoperationshub.booking.service.BookingService;
import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.security.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserService currentUserService;

    public BookingController(BookingService bookingService, CurrentUserService currentUserService) {
        this.bookingService = bookingService;
        this.currentUserService = currentUserService;
    }

    // FR7 + FR8: request booking + validate
    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody CreateBookingRequest request) {
        User user = currentUserService.requireUser();
        Booking booking = bookingService.createBooking(user, request);
        return ResponseEntity.ok(Map.of(
                "message", "Booking request created",
                "booking", toBookingView(booking)
        ));
    }

    // FR11: view own bookings
    @GetMapping("/mine")
    public ResponseEntity<List<Map<String, Object>>> mine() {
        User user = currentUserService.requireUser();
        return ResponseEntity.ok(
                bookingService.getMyBookings(user).stream().map(this::toBookingView).collect(Collectors.toList())
        );
    }

    // FR11: cancel own booking
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> cancel(@PathVariable Long id, @RequestParam(required = false) String note) {
        User user = currentUserService.requireUser();
        Booking booking = bookingService.cancelMyBooking(user, id, note);
        return ResponseEntity.ok(Map.of(
                "message", "Booking cancelled",
                "booking", toBookingView(booking)
        ));
    }

    // FR12: history/audit
    @GetMapping("/{id}/history")
    public ResponseEntity<List<Map<String, Object>>> history(@PathVariable Long id) {
        User user = currentUserService.requireUser();
        List<BookingAudit> audits = bookingService.getHistory(user, id);
        return ResponseEntity.ok(audits.stream().map(this::toAuditView).collect(Collectors.toList()));
    }

    // FR10: admin list pending
    @GetMapping("/admin/pending")
    public ResponseEntity<List<Map<String, Object>>> adminPending() {
        User admin = currentUserService.requireUser();
        return ResponseEntity.ok(
                bookingService.getPendingForAdmin(admin).stream().map(this::toBookingView).collect(Collectors.toList())
        );
    }

    // FR10: admin approve (PENDING -> APPROVED)
    @PostMapping("/admin/{id}/approve")
    public ResponseEntity<Map<String, Object>> approve(@PathVariable Long id, @RequestBody(required = false) DecisionRequest request) {
        User admin = currentUserService.requireUser();
        Booking booking = bookingService.approve(admin, id, request == null ? null : request.getReason());
        return ResponseEntity.ok(Map.of(
                "message", "Booking approved",
                "booking", toBookingView(booking)
        ));
    }

    // FR10: admin reject (PENDING -> REJECTED)
    @PostMapping("/admin/{id}/reject")
    public ResponseEntity<Map<String, Object>> reject(@PathVariable Long id, @RequestBody(required = false) DecisionRequest request) {
        User admin = currentUserService.requireUser();
        Booking booking = bookingService.reject(admin, id, request == null ? null : request.getReason());
        return ResponseEntity.ok(Map.of(
                "message", "Booking rejected",
                "booking", toBookingView(booking)
        ));
    }

    private Map<String, Object> toBookingView(Booking b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.getId());
        m.put("resourceId", b.getResourceId());
        m.put("startAt", b.getStartAt());
        m.put("endAt", b.getEndAt());
        m.put("purpose", b.getPurpose());
        m.put("status", b.getStatus());
        m.put("createdByUserId", b.getCreatedByUserId());
        m.put("createdByEmail", b.getCreatedByEmail());
        m.put("createdAt", b.getCreatedAt());
        m.put("updatedAt", b.getUpdatedAt());
        m.put("decidedByUserId", b.getDecidedByUserId());
        m.put("decidedByEmail", b.getDecidedByEmail());
        m.put("decidedAt", b.getDecidedAt());
        m.put("decisionReason", b.getDecisionReason());
        return m;
    }

    private Map<String, Object> toAuditView(BookingAudit a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("bookingId", a.getBookingId());
        m.put("fromStatus", a.getFromStatus());
        m.put("toStatus", a.getToStatus());
        m.put("changedAt", a.getChangedAt());
        m.put("changedByUserId", a.getChangedByUserId());
        m.put("changedByEmail", a.getChangedByEmail());
        m.put("note", a.getNote());
        return m;
    }
}

