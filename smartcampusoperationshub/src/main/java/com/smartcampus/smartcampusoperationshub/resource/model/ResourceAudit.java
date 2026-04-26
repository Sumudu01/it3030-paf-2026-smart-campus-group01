package com.smartcampus.smartcampusoperationshub.resource.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "campus_resource_audits")
public class ResourceAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long resourceId;
    private String action; // CREATE, UPDATE, DELETE, DEACTIVATE, MAINTENANCE_START, MAINTENANCE_END
    private Long performedByUserId;
    private String performedByUserEmail;
    private LocalDateTime performedAt;
    private String details;

    @PrePersist
    protected void onPersist() {
        performedAt = LocalDateTime.now();
    }

    // Constructor, Getters and Setters
    public ResourceAudit() {}

    public ResourceAudit(Long resourceId, String action, Long userId, String email, String details) {
        this.resourceId = resourceId;
        this.action = action;
        this.performedByUserId = userId;
        this.performedByUserEmail = email;
        this.details = details;
    }

    public Long getId() { return id; }
    public Long getResourceId() { return resourceId; }
    public String getAction() { return action; }
    public Long getPerformedByUserId() { return performedByUserId; }
    public String getPerformedByUserEmail() { return performedByUserEmail; }
    public LocalDateTime getPerformedAt() { return performedAt; }
    public String getDetails() { return details; }
}
