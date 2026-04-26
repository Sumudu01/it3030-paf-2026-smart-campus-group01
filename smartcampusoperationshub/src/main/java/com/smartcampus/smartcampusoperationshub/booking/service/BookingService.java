package com.smartcampus.smartcampusoperationshub.booking.service;

import com.smartcampus.smartcampusoperationshub.api.ApiExceptions;
import com.smartcampus.smartcampusoperationshub.booking.dto.CreateBookingRequest;
import com.smartcampus.smartcampusoperationshub.booking.model.Booking;
import com.smartcampus.smartcampusoperationshub.booking.model.BookingAudit;
import com.smartcampus.smartcampusoperationshub.booking.model.BookingStatus;
import com.smartcampus.smartcampusoperationshub.booking.repository.BookingAuditRepository;
import com.smartcampus.smartcampusoperationshub.booking.repository.BookingRepository;
import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.model.UserRole;
import com.smartcampus.smartcampusoperationshub.notification.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;

@Service
public class BookingService {

    private static final EnumSet<BookingStatus> ACTIVE_FOR_OVERLAP = EnumSet.of(BookingStatus.PENDING, BookingStatus.APPROVED);

    private final BookingRepository bookingRepository;
    private final BookingAuditRepository bookingAuditRepository;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository, 
                          BookingAuditRepository bookingAuditRepository,
                          NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.bookingAuditRepository = bookingAuditRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Booking createBooking(User user, CreateBookingRequest req) {
        if (req == null) throw new ApiExceptions.BadRequestException("Request body required");
        String resourceId = req.getResourceId() == null ? null : req.getResourceId().trim();
        String purpose = req.getPurpose() == null ? null : req.getPurpose().trim();
        LocalDateTime startAt = req.getStartAt();
        LocalDateTime endAt = req.getEndAt();

        if (resourceId == null || resourceId.isBlank()) {
            throw new ApiExceptions.BadRequestException("resourceId is required");
        }
        if (purpose == null || purpose.isBlank()) {
            throw new ApiExceptions.BadRequestException("purpose is required");
        }
        if (startAt == null || endAt == null) {
            throw new ApiExceptions.BadRequestException("startAt and endAt are required");
        }
        if (!endAt.isAfter(startAt)) {
            throw new ApiExceptions.BadRequestException("Invalid time range: endAt must be after startAt");
        }

        // Resource-module validation hook (minimal for now): ensure resourceId is present.
        // If you add a Resource module later, validate resource existence here.

        boolean overlaps = bookingRepository.existsOverlappingActiveBooking(resourceId, startAt, endAt, ACTIVE_FOR_OVERLAP);
        if (overlaps) {
            throw new ApiExceptions.ConflictException("Overlapping booking exists for this resource and time range");
        }

        Booking booking = new Booking();
        booking.setResourceId(resourceId);
        booking.setStartAt(startAt);
        booking.setEndAt(endAt);
        booking.setPurpose(purpose);
        booking.setStatus(BookingStatus.PENDING);
        booking.setCreatedByUserId(user.getId());
        booking.setCreatedByEmail(user.getEmail());

        booking = bookingRepository.save(booking);
        bookingAuditRepository.save(new BookingAudit(
                booking.getId(),
                null,
                BookingStatus.PENDING,
                user.getId(),
                user.getEmail(),
                "Booking requested"
        ));

        notificationService.createNotification(
                user.getId(),
                "Booking Submitted",
                "Your booking for " + resourceId + " has been submitted and is pending approval.",
                "BOOKING",
                booking.getId()
        );

        return booking;
    }

    @Transactional(readOnly = true)
    public List<Booking> getMyBookings(User user) {
        return bookingRepository.findByCreatedByUserIdOrderByStartAtDesc(user.getId());
    }

    @Transactional
    public Booking cancelMyBooking(User user, Long bookingId, String note) {
        Booking booking = bookingRepository.findByIdAndCreatedByUserId(bookingId, user.getId())
                .orElseThrow(() -> new ApiExceptions.NotFoundException("Booking not found"));

        BookingStatus from = booking.getStatus();
        if (from == BookingStatus.CANCELLED) return booking;
        if (from == BookingStatus.REJECTED) {
            throw new ApiExceptions.BadRequestException("Rejected bookings cannot be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking = bookingRepository.save(booking);
        bookingAuditRepository.save(new BookingAudit(
                booking.getId(),
                from,
                BookingStatus.CANCELLED,
                user.getId(),
                user.getEmail(),
                (note == null || note.isBlank()) ? "Cancelled by user" : note.trim()
        ));

        notificationService.createNotification(
                user.getId(),
                "Booking Cancelled",
                "Your booking for " + booking.getResourceId() + " has been cancelled.",
                "BOOKING",
                booking.getId()
        );

        return booking;
    }

    @Transactional(readOnly = true)
    public List<Booking> getPendingForAdmin(User adminUser) {
        requireAdmin(adminUser);
        return bookingRepository.findByStatusInOrderByCreatedAtAsc(List.of(BookingStatus.PENDING));
    }

    @Transactional
    public Booking approve(User adminUser, Long bookingId, String reason) {
        requireAdmin(adminUser);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiExceptions.NotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ApiExceptions.BadRequestException("Only PENDING bookings can be approved");
        }

        // Re-check overlap at approval time to prevent race conditions.
        boolean overlaps = bookingRepository.existsOverlappingActiveBooking(
                booking.getResourceId(),
                booking.getStartAt(),
                booking.getEndAt(),
                EnumSet.of(BookingStatus.APPROVED) // if another approved booking exists, block approval
        );
        if (overlaps) {
            throw new ApiExceptions.ConflictException("Cannot approve: overlaps with an already APPROVED booking");
        }

        BookingStatus from = booking.getStatus();
        booking.setStatus(BookingStatus.APPROVED);
        booking.setDecidedByUserId(adminUser.getId());
        booking.setDecidedByEmail(adminUser.getEmail());
        booking.setDecidedAt(LocalDateTime.now());
        booking.setDecisionReason(trimOrNull(reason));

        booking = bookingRepository.save(booking);
        bookingAuditRepository.save(new BookingAudit(
                booking.getId(),
                from,
                BookingStatus.APPROVED,
                adminUser.getId(),
                adminUser.getEmail(),
                "Approved" + suffixReason(reason)
        ));

        notificationService.createNotification(
                booking.getCreatedByUserId(),
                "Booking Approved",
                "Your booking for " + booking.getResourceId() + " has been approved.",
                "BOOKING",
                booking.getId()
        );
        return booking;
    }

    @Transactional
    public Booking reject(User adminUser, Long bookingId, String reason) {
        requireAdmin(adminUser);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiExceptions.NotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ApiExceptions.BadRequestException("Only PENDING bookings can be rejected");
        }

        BookingStatus from = booking.getStatus();
        booking.setStatus(BookingStatus.REJECTED);
        booking.setDecidedByUserId(adminUser.getId());
        booking.setDecidedByEmail(adminUser.getEmail());
        booking.setDecidedAt(LocalDateTime.now());
        booking.setDecisionReason(trimOrNull(reason));

        booking = bookingRepository.save(booking);
        bookingAuditRepository.save(new BookingAudit(
                booking.getId(),
                from,
                BookingStatus.REJECTED,
                adminUser.getId(),
                adminUser.getEmail(),
                "Rejected" + suffixReason(reason)
        ));

        notificationService.createNotification(
                booking.getCreatedByUserId(),
                "Booking Rejected",
                "Your booking for " + booking.getResourceId() + " has been rejected." + suffixReason(reason),
                "BOOKING",
                booking.getId()
        );
        return booking;
    }

    @Transactional(readOnly = true)
    public List<BookingAudit> getHistory(User user, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiExceptions.NotFoundException("Booking not found"));

        boolean isOwner = booking.getCreatedByUserId().equals(user.getId());
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ApiExceptions.ForbiddenException("Not allowed to view this booking history");
        }

        return bookingAuditRepository.findByBookingIdOrderByChangedAtAsc(bookingId);
    }

    private void requireAdmin(User user) {
        if (user.getRole() != UserRole.ADMIN) {
            throw new ApiExceptions.ForbiddenException("Admin role required");
        }
    }

    private String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isBlank() ? null : t;
    }

    private String suffixReason(String reason) {
        String t = trimOrNull(reason);
        return t == null ? "" : ": " + t;
    }
}

