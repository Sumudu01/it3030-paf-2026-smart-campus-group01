package com.smartcampus.smartcampusoperationshub.resource.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "campus_resource_closures")
public class ResourceClosure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long resourceId;

    @Column(nullable = false)
    private LocalDate closureDate;

    private String reason;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getResourceId() { return resourceId; }
    public void setResourceId(Long resourceId) { this.resourceId = resourceId; }
    public LocalDate getClosureDate() { return closureDate; }
    public void setClosureDate(LocalDate closureDate) { this.closureDate = closureDate; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
