package com.smartcampus.smartcampusoperationshub.ticket.controller;

import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.security.CurrentUserService;
import com.smartcampus.smartcampusoperationshub.ticket.model.Ticket;
import com.smartcampus.smartcampusoperationshub.ticket.model.TicketComment;
import com.smartcampus.smartcampusoperationshub.ticket.model.TicketStatus;
import com.smartcampus.smartcampusoperationshub.ticket.service.FileStorageService;
import com.smartcampus.smartcampusoperationshub.ticket.service.TicketService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final CurrentUserService currentUserService;
    private final FileStorageService fileStorageService;

    public TicketController(TicketService ticketService, 
                            CurrentUserService currentUserService, 
                            FileStorageService fileStorageService) {
        this.ticketService = ticketService;
        this.currentUserService = currentUserService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Ticket> createTicket(@RequestParam("resourceId") String resourceId,
                                              @RequestParam("category") String category,
                                              @RequestParam("description") String description,
                                              @RequestParam(value = "images", required = false) List<MultipartFile> images) {
        User user = currentUserService.requireUser();
        Ticket ticket = ticketService.createTicket(resourceId, category, description, images, user);
        return ResponseEntity.ok(ticket);
    }

    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        User user = currentUserService.requireUser();
        // Depending on role, we might want to filter, but let's provide all for now
        // and handle filtering in the service if needed.
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/mine")
    public ResponseEntity<List<Ticket>> getMyTickets() {
        User user = currentUserService.requireUser();
        return ResponseEntity.ok(ticketService.getMyTickets(user.getId()));
    }

    @GetMapping("/assigned")
    public ResponseEntity<List<Ticket>> getAssignedTickets() {
        User user = currentUserService.requireUser();
        return ResponseEntity.ok(ticketService.getAssignedTickets(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<Ticket> assignTechnician(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        User admin = currentUserService.requireUser();
        Long technicianId = payload.get("technicianId");
        return ResponseEntity.ok(ticketService.assignTechnician(id, technicianId, admin));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User user = currentUserService.requireUser();
        TicketStatus status = TicketStatus.valueOf(payload.get("status"));
        String resolutionNotes = payload.get("resolutionNotes");
        return ResponseEntity.ok(ticketService.updateStatus(id, status, resolutionNotes, user));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketComment> addComment(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User user = currentUserService.requireUser();
        String content = payload.get("content");
        return ResponseEntity.ok(ticketService.addComment(id, content, user));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TicketComment>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getComments(id));
    }

    @GetMapping("/images/{fileName:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String fileName) {
        try {
            Path filePath = fileStorageService.getFilePath(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
