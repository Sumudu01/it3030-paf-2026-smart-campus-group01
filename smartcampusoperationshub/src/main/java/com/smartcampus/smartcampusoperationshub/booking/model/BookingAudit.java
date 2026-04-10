package com.smartcampus.smartcampusoperationshub.booking.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "booking_audits",
        indexes = {
                @Index(name = "idx_booking_audit_booking", columnList = "bookingId,changedAt")
        }
)
public class BookingAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long bookingId;

    @Enumerated(EnumType.STRING)
    private BookingStatus fromStatus;

    @Enumerated(EnumType.STRING)
    private BookingStatus toStatus;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    private Long changedByUserId;
    private String changedByEmail;

    @Column(length = 1000)
    private String note;

    public BookingAudit() {}

    public BookingAudit(Long bookingId, BookingStatus fromStatus, BookingStatus toStatus,
                        Long changedByUserId, String changedByEmail, String note) {
        this.bookingId = bookingId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedByUserId = changedByUserId;
        this.changedByEmail = changedByEmail;
        this.note = note;
        this.changedAt = LocalDateTime.now();
    }

    @PrePersist
    void prePersist() {
        if (changedAt == null) changedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }

    public BookingStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(BookingStatus fromStatus) { this.fromStatus = fromStatus; }

    public BookingStatus getToStatus() { return toStatus; }
    public void setToStatus(BookingStatus toStatus) { this.toStatus = toStatus; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }

    public Long getChangedByUserId() { return changedByUserId; }
    public void setChangedByUserId(Long changedByUserId) { this.changedByUserId = changedByUserId; }

    public String getChangedByEmail() { return changedByEmail; }
    public void setChangedByEmail(String changedByEmail) { this.changedByEmail = changedByEmail; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}

