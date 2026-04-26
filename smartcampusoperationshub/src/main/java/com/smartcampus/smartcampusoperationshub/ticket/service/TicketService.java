package com.smartcampus.smartcampusoperationshub.ticket.service;

import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.model.UserRole;
import com.smartcampus.smartcampusoperationshub.repository.UserRepository;
import com.smartcampus.smartcampusoperationshub.ticket.model.Ticket;
import com.smartcampus.smartcampusoperationshub.ticket.model.TicketComment;
import com.smartcampus.smartcampusoperationshub.ticket.model.TicketImage;
import com.smartcampus.smartcampusoperationshub.ticket.model.TicketStatus;
import com.smartcampus.smartcampusoperationshub.ticket.repository.TicketCommentRepository;
import com.smartcampus.smartcampusoperationshub.ticket.repository.TicketRepository;
import com.smartcampus.smartcampusoperationshub.notification.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    public TicketService(TicketRepository ticketRepository, 
                         TicketCommentRepository commentRepository, 
                         UserRepository userRepository, 
                         FileStorageService fileStorageService,
                         NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Ticket createTicket(String resourceId, String category, String description, List<MultipartFile> images, User creator) {
        Ticket ticket = new Ticket();
        ticket.setResourceId(resourceId);
        ticket.setCategory(category);
        ticket.setDescription(description);
        ticket.setCreatedByUserId(creator.getId());
        ticket.setCreatedByEmail(creator.getEmail());
        ticket.setStatus(TicketStatus.OPEN);

        if (images != null && !images.isEmpty()) {
            if (images.size() > 3) {
                throw new RuntimeException("Maximum 3 images allowed per ticket.");
            }
            for (MultipartFile file : images) {
                String fileName = fileStorageService.storeFile(file);
                TicketImage image = new TicketImage();
                image.setTicket(ticket);
                image.setFileName(fileName);
                image.setFileUrl("/api/tickets/images/" + fileName);
                ticket.getImages().add(image);
            }
        }
        Ticket savedTicket = ticketRepository.save(ticket);
        
        notificationService.createNotification(
                creator.getId(),
                "Incident Reported",
                "Your incident report for " + resourceId + " has been submitted.",
                "TICKET",
                savedTicket.getId()
        );
        
        return savedTicket;
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public List<Ticket> getMyTickets(Long userId) {
        return ticketRepository.findByCreatedByUserId(userId);
    }

    public List<Ticket> getAssignedTickets(Long technicianId) {
        return ticketRepository.findByAssignedTechnicianId(technicianId);
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
    }

    @Transactional
    public Ticket assignTechnician(Long ticketId, Long technicianId, User admin) {
        if (admin.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("Only admins can assign technicians.");
        }

        Ticket ticket = getTicketById(ticketId);
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Technician not found with id: " + technicianId));

        if (technician.getRole() != UserRole.TECHNICIAN) {
            technician.setRole(UserRole.TECHNICIAN);
            userRepository.save(technician);
        }

        ticket.setAssignedTechnicianId(technician.getId());
        ticket.setAssignedTechnicianEmail(technician.getEmail());
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        
        Ticket savedTicket = ticketRepository.save(ticket);

        notificationService.createNotification(
                ticket.getCreatedByUserId(),
                "Technician Assigned",
                "A technician has been assigned to your ticket: " + ticket.getResourceId(),
                "TICKET",
                ticket.getId()
        );

        notificationService.createNotification(
                technicianId,
                "New Ticket Assigned",
                "You have been assigned to a new ticket: " + ticket.getResourceId(),
                "TICKET",
                ticket.getId()
        );
        
        return savedTicket;
    }

    @Transactional
    public Ticket updateStatus(Long ticketId, TicketStatus newStatus, String resolutionNotes, User user) {
        Ticket ticket = getTicketById(ticketId);

        // Validation based on roles and current status
        if (newStatus == TicketStatus.IN_PROGRESS || newStatus == TicketStatus.RESOLVED) {
            if (user.getRole() != UserRole.TECHNICIAN && user.getRole() != UserRole.ADMIN) {
                throw new RuntimeException("Only technicians or admins can set status to " + newStatus);
            }
            if (newStatus == TicketStatus.RESOLVED) {
                if (resolutionNotes == null || resolutionNotes.trim().isEmpty()) {
                    throw new RuntimeException("Resolution notes are required when resolving a ticket.");
                }
                ticket.setResolutionNotes(resolutionNotes);
            }
        } else if (newStatus == TicketStatus.CLOSED) {
            if (!ticket.getCreatedByUserId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
                throw new RuntimeException("Only the creator or admin can close the ticket.");
            }
        }

        ticket.setStatus(newStatus);
        Ticket savedTicket = ticketRepository.save(ticket);

        notificationService.createNotification(
                ticket.getCreatedByUserId(),
                "Ticket Status Updated",
                "Your ticket status has been updated to: " + newStatus,
                "TICKET",
                ticket.getId()
        );

        return savedTicket;
    }

    @Transactional
    public TicketComment addComment(Long ticketId, String content, User user) {
        Ticket ticket = getTicketById(ticketId);
        
        TicketComment comment = new TicketComment();
        comment.setTicket(ticket);
        comment.setUserId(user.getId());
        comment.setUserEmail(user.getEmail());
        comment.setContent(content);
        
        TicketComment savedComment = commentRepository.save(comment);

        // Notify creator if someone else commented
        if (!ticket.getCreatedByUserId().equals(user.getId())) {
            notificationService.createNotification(
                    ticket.getCreatedByUserId(),
                    "New Comment on Ticket",
                    "There is a new comment on your ticket: " + ticket.getResourceId(),
                    "TICKET",
                    ticket.getId()
            );
        }

        // Notify technician if someone else commented
        if (ticket.getAssignedTechnicianId() != null && !ticket.getAssignedTechnicianId().equals(user.getId())) {
            notificationService.createNotification(
                    ticket.getAssignedTechnicianId(),
                    "New Comment on Assigned Ticket",
                    "There is a new comment on a ticket assigned to you: " + ticket.getResourceId(),
                    "TICKET",
                    ticket.getId()
            );
        }

        return savedComment;
    }

    public List<TicketComment> getComments(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }
}
