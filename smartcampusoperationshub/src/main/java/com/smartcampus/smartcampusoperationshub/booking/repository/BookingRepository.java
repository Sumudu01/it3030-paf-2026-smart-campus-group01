package com.smartcampus.smartcampusoperationshub.booking.repository;

import com.smartcampus.smartcampusoperationshub.booking.model.Booking;
import com.smartcampus.smartcampusoperationshub.booking.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCreatedByUserIdOrderByStartAtDesc(Long createdByUserId);

    List<Booking> findByStatusInOrderByCreatedAtAsc(Collection<BookingStatus> statuses);

    Optional<Booking> findByIdAndCreatedByUserId(Long id, Long createdByUserId);

    @Query("""
            select (count(b) > 0) from Booking b
            where b.resourceId = :resourceId
              and b.status in :activeStatuses
              and b.startAt < :endAt
              and b.endAt > :startAt
            """)
    boolean existsOverlappingActiveBooking(
            @Param("resourceId") String resourceId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt,
            @Param("activeStatuses") Collection<BookingStatus> activeStatuses
    );

    long countByResourceId(String resourceId);
}

