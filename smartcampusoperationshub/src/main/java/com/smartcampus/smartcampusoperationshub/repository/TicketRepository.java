package com.smartcampus.smartcampusoperationshub.repository;

import com.smartcampus.smartcampusoperationshub.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // ✅ FIXED TO USE STRING (NOT ENUM)
    List<Ticket> findByStatus(String status);

    // ✅ FIXED TO USE STRING (NOT ENUM)
    List<Ticket> findByPriority(String priority);
}