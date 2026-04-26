package com.smartcampus.smartcampusoperationshub.resource.service;

import com.smartcampus.smartcampusoperationshub.booking.repository.BookingRepository;
import com.smartcampus.smartcampusoperationshub.booking.model.BookingStatus;
import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.resource.model.*;
import com.smartcampus.smartcampusoperationshub.resource.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceScheduleRepository scheduleRepository;
    private final ResourceClosureRepository closureRepository;
    private final MaintenanceWindowRepository maintenanceRepository;
    private final ResourceAuditRepository auditRepository;
    private final BookingRepository bookingRepository;

    public ResourceService(ResourceRepository resourceRepository,
                           ResourceScheduleRepository scheduleRepository,
                           ResourceClosureRepository closureRepository,
                           MaintenanceWindowRepository maintenanceRepository,
                           ResourceAuditRepository auditRepository,
                           BookingRepository bookingRepository) {
        this.resourceRepository = resourceRepository;
        this.scheduleRepository = scheduleRepository;
        this.closureRepository = closureRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.auditRepository = auditRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public Resource createResource(Resource resource, User admin) {
        Resource saved = resourceRepository.save(resource);
        auditRepository.save(new ResourceAudit(saved.getId(), "CREATE", admin.getId(), admin.getEmail(), "Created resource: " + saved.getName()));
        return saved;
    }

    @Transactional
    public Resource updateResource(Long id, Resource details, User admin) {
        Resource resource = resourceRepository.findById(id).orElseThrow(() -> new RuntimeException("Resource not found"));
        resource.setName(details.getName());
        resource.setType(details.getType());
        resource.setCapacity(details.getCapacity());
        resource.setLocation(details.getLocation());
        resource.setStatus(details.getStatus());
        resource.setDescription(details.getDescription());
        
        Resource updated = resourceRepository.save(resource);
        auditRepository.save(new ResourceAudit(updated.getId(), "UPDATE", admin.getId(), admin.getEmail(), "Updated resource details"));
        return updated;
    }

    @Transactional
    public void deactivateResource(Long id, User admin) {
        Resource resource = resourceRepository.findById(id).orElseThrow(() -> new RuntimeException("Resource not found"));
        resource.setStatus(Resource.ResourceStatus.INACTIVE);
        resourceRepository.save(resource);
        auditRepository.save(new ResourceAudit(id, "DEACTIVATE", admin.getId(), admin.getEmail(), "Deactivated resource"));
    }

    public List<Resource> searchResources(String type, String location, Integer minCapacity) {
        return resourceRepository.searchResources(type, location, minCapacity);
    }

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public Resource getResourceById(Long id) {
        return resourceRepository.findById(id).orElseThrow(() -> new RuntimeException("Resource not found"));
    }

    // Availability Check (FR3)
    public boolean isAvailable(Long resourceId, LocalDateTime start, LocalDateTime end) {
        Resource resource = getResourceById(resourceId);
        
        // 1. Check if resource is active
        if (resource.getStatus() != Resource.ResourceStatus.ACTIVE) return false;

        // 2. Check Closure Dates
        LocalDate startDate = start.toLocalDate();
        if (closureRepository.findByResourceIdAndClosureDate(resourceId, startDate).isPresent()) return false;

        // 3. Check Weekly Schedule
        int dayOfWeek = start.getDayOfWeek().getValue(); // 1 (Mon) to 7 (Sun)
        List<ResourceSchedule> schedules = scheduleRepository.findByResourceIdAndDayOfWeek(resourceId, dayOfWeek);
        if (schedules.isEmpty()) return false; // Not open on this day

        boolean withinSchedule = false;
        LocalTime startTime = start.toLocalTime();
        LocalTime endTime = end.toLocalTime();
        for (ResourceSchedule schedule : schedules) {
            if ((startTime.equals(schedule.getStartTime()) || startTime.isAfter(schedule.getStartTime())) &&
                (endTime.equals(schedule.getEndTime()) || endTime.isBefore(schedule.getEndTime()))) {
                withinSchedule = true;
                break;
            }
        }
        if (!withinSchedule) return false;

        // 4. Check Maintenance Windows
        if (maintenanceRepository.existsOverlappingMaintenance(resourceId, start, end)) return false;

        // 5. Check Existing Bookings
        boolean hasOverlappingBooking = bookingRepository.existsOverlappingActiveBooking(
                String.valueOf(resourceId), 
                start, 
                end, 
                EnumSet.of(BookingStatus.PENDING, BookingStatus.APPROVED)
        );
        
        return !hasOverlappingBooking;
    }

    @Transactional
    public void addSchedule(ResourceSchedule schedule, User admin) {
        scheduleRepository.save(schedule);
        auditRepository.save(new ResourceAudit(schedule.getResourceId(), "SCHEDULE_ADD", admin.getId(), admin.getEmail(), "Added weekly schedule"));
    }

    @Transactional
    public void addClosure(ResourceClosure closure, User admin) {
        closureRepository.save(closure);
        auditRepository.save(new ResourceAudit(closure.getResourceId(), "CLOSURE_ADD", admin.getId(), admin.getEmail(), "Added special closure date"));
    }

    @Transactional
    public void addMaintenance(MaintenanceWindow maintenance, User admin) {
        maintenanceRepository.save(maintenance);
        auditRepository.save(new ResourceAudit(maintenance.getResourceId(), "MAINTENANCE_SCHEDULE", admin.getId(), admin.getEmail(), "Scheduled maintenance window"));
    }

    // Analytics (FR6)
    public Map<String, Object> getUsageAnalytics() {
        // Simplified most used resources based on booking counts
        List<Resource> resources = resourceRepository.findAll();
        List<Map<String, Object>> resourceStats = resources.stream().map(r -> {
            long count = bookingRepository.countByResourceId(String.valueOf(r.getId()));
            Map<String, Object> stat = new HashMap<>();
            stat.put("name", r.getName());
            stat.put("bookings", count);
            return stat;
        }).sorted((a, b) -> Long.compare((long)b.get("bookings"), (long)a.get("bookings")))
          .limit(5)
          .collect(Collectors.toList());

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("mostUsed", resourceStats);
        // Note: Peak hours analysis would require more complex grouping of booking times
        analytics.put("peakHours", "10:00 - 14:00 (Simulated)"); 
        return analytics;
    }
}
