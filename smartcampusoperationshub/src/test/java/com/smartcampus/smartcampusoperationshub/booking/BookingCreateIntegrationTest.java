package com.smartcampus.smartcampusoperationshub.booking;

import com.smartcampus.smartcampusoperationshub.booking.dto.CreateBookingRequest;
import com.smartcampus.smartcampusoperationshub.booking.service.BookingService;
import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@SpringBootTest
class BookingCreateIntegrationTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @Transactional
    void createBooking_persistsLikeProductionForm() {
        User user = userRepository.findAll().stream().findFirst().orElseThrow();

        CreateBookingRequest req = new CreateBookingRequest();
        req.setResourceId("Lab-01");
        req.setStartAt(LocalDateTime.of(2026, 4, 11, 16, 35, 0));
        req.setEndAt(LocalDateTime.of(2026, 4, 24, 12, 30, 0));
        req.setPurpose("tutorial");

        bookingService.createBooking(user, req);
    }
}
