package com.smartcampus.smartcampusoperationshub.ticket.repository;

import com.smartcampus.smartcampusoperationshub.ticket.model.Ticket;
import com.smartcampus.smartcampusoperationshub.ticket.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByCreatedByUserId(Long userId);
    List<Ticket> findByAssignedTechnicianId(Long technicianId);
    List<Ticket> findByStatus(TicketStatus status);
}
