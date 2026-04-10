package com.smartcampus.smartcampusoperationshub.booking.dto;

import java.time.LocalDateTime;

public class CreateBookingRequest {
    private String resourceId;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String purpose;

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public LocalDateTime getStartAt() { return startAt; }
    public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }

    public LocalDateTime getEndAt() { return endAt; }
    public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
}

