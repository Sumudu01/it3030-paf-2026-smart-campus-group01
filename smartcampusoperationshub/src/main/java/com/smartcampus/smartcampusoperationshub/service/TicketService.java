package com.smartcampus.smartcampusoperationshub.service;

import com.smartcampus.smartcampusoperationshub.model.Ticket;
import com.smartcampus.smartcampusoperationshub.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public Ticket createTicket(Ticket ticket) {
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id).orElse(null);
    }

    // FILTER BY STATUS
    public List<Ticket> getTicketsByStatus(String status) {
        return ticketRepository.findByStatus(status);
    }

    // FILTER BY PRIORITY
    public List<Ticket> getTicketsByPriority(String priority) {
        System.out.println("Priority: " + priority);
        return ticketRepository.findByPriority(priority);
    }

    public Ticket updateTicket(Long id, Ticket updatedTicket) {
        Ticket ticket = ticketRepository.findById(id).orElse(null);
        if (ticket != null) {
            ticket.setTitle(updatedTicket.getTitle());
            ticket.setDescription(updatedTicket.getDescription());
            ticket.setLocation(updatedTicket.getLocation());
            ticket.setStatus(updatedTicket.getStatus());
            ticket.setPriority(updatedTicket.getPriority());
            ticket.setUpdatedAt(LocalDateTime.now());
            return ticketRepository.save(ticket);
        }
        return null;
    }

    public void deleteTicket(Long id) {
        ticketRepository.deleteById(id);
    }

    public Ticket updateStatus(Long id, String status) {
        Ticket ticket = ticketRepository.findById(id).orElse(null);
        if (ticket != null) {
            ticket.setStatus(status);
            ticket.setUpdatedAt(java.time.LocalDateTime.now());
            return ticketRepository.save(ticket);
        }
        return null;
    }

    public List<Ticket> searchTickets(String keyword) {
        List<Ticket> byTitle = ticketRepository.findByTitleContainingIgnoreCase(keyword);
        List<Ticket> byDescription = ticketRepository.findByDescriptionContainingIgnoreCase(keyword);
        
        byTitle.addAll(byDescription);
        return byTitle;
    }
}