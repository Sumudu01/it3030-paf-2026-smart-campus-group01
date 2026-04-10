package com.smartcampus.smartcampusoperationshub.booking.repository;

import com.smartcampus.smartcampusoperationshub.booking.model.BookingAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingAuditRepository extends JpaRepository<BookingAudit, Long> {
    List<BookingAudit> findByBookingIdOrderByChangedAtAsc(Long bookingId);
}

