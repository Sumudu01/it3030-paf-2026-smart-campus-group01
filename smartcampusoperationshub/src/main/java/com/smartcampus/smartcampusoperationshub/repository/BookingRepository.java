package com.smartcampus.smartcampusoperationshub.repository;

import com.smartcampus.smartcampusoperationshub.model.Booking;
import com.smartcampus.smartcampusoperationshub.model.BookingStatus;
import com.smartcampus.smartcampusoperationshub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    // User bookings
    List<Booking> findByUserOrderByStartTimeDesc(User user);
    List<Booking> findByUserIdOrderByStartTimeDesc(Long userId);
    
    // Admin queries
    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);
    List<Booking> findByStatusInOrderByCreatedAtDesc(List<BookingStatus> statuses);
    List<Booking> findAllByOrderByStartTimeDesc();
    
    // Overlap detection - prevent double booking
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.status != 'CANCELLED' " +
           "AND b.status != 'REJECTED' " +
           "AND ((b.startTime <= :endTime AND b.endTime >= :startTime))")
    List<Booking> findOverlappingBookings(@Param("resourceId") Long resourceId,
                                        @Param("startTime") LocalDateTime startTime,
                                        @Param("endTime") LocalDateTime endTime);
    
    // Overlap excluding current booking (for updates)
    @Query("SELECT b FROM Booking b WHERE b.id != :bookingId " +
           "AND b.resource.id = :resourceId " +
           "AND b.status != 'CANCELLED' " +
           "AND b.status != 'REJECTED' " +
           "AND ((b.startTime <= :endTime AND b.endTime >= :startTime))")
    List<Booking> findOverlappingBookingsExcludingSelf(@Param("bookingId") Long bookingId,
                                                     @Param("resourceId") Long resourceId,
                                                     @Param("startTime") LocalDateTime startTime,
                                                     @Param("endTime") LocalDateTime endTime);
    
    // Convenience methods
    Optional<Booking> findFirstByUserIdAndStatusOrderByStartTimeDesc(Long userId, BookingStatus status);
    Long countByUserIdAndStatus(Long userId, BookingStatus status);
}
