package com.smartcampus.smartcampusoperationshub.resource.controller;

import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.resource.model.*;
import com.smartcampus.smartcampusoperationshub.resource.service.ResourceService;
import com.smartcampus.smartcampusoperationshub.security.CurrentUserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;
    private final CurrentUserService currentUserService;

    public ResourceController(ResourceService resourceService, CurrentUserService currentUserService) {
        this.resourceService = resourceService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Resource> getAllResources() {
        return resourceService.getAllResources();
    }

    @GetMapping("/search")
    public List<Resource> searchResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity) {
        return resourceService.searchResources(type, location, minCapacity);
    }

    @GetMapping("/{id}")
    public Resource getResource(@PathVariable Long id) {
        return resourceService.getResourceById(id);
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<Map<String, Boolean>> checkAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        boolean available = resourceService.isAvailable(id, start, end);
        return ResponseEntity.ok(Map.of("available", available));
    }

    @PostMapping
    public Resource createResource(@RequestBody Resource resource) {
        User admin = currentUserService.requireAdmin();
        return resourceService.createResource(resource, admin);
    }

    @PutMapping("/{id}")
    public Resource updateResource(@PathVariable Long id, @RequestBody Resource resource) {
        User admin = currentUserService.requireAdmin();
        return resourceService.updateResource(id, resource, admin);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateResource(@PathVariable Long id) {
        User admin = currentUserService.requireAdmin();
        resourceService.deactivateResource(id, admin);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/schedules")
    public ResponseEntity<Void> addSchedule(@RequestBody ResourceSchedule schedule) {
        User admin = currentUserService.requireAdmin();
        resourceService.addSchedule(schedule, admin);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/closures")
    public ResponseEntity<Void> addClosure(@RequestBody ResourceClosure closure) {
        User admin = currentUserService.requireAdmin();
        resourceService.addClosure(closure, admin);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/maintenance")
    public ResponseEntity<Void> addMaintenance(@RequestBody MaintenanceWindow maintenance) {
        User admin = currentUserService.requireAdmin();
        resourceService.addMaintenance(maintenance, admin);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics() {
        currentUserService.requireAdmin();
        return resourceService.getUsageAnalytics();
    }
}
