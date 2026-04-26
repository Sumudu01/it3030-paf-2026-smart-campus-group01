package com.smartcampus.smartcampusoperationshub.resource.repository;

import com.smartcampus.smartcampusoperationshub.resource.model.MaintenanceWindow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MaintenanceWindowRepository extends JpaRepository<MaintenanceWindow, Long> {
    List<MaintenanceWindow> findByResourceId(Long resourceId);

    @Query("SELECT COUNT(m) > 0 FROM MaintenanceWindow m WHERE m.resourceId = :resourceId AND " +
           "((m.startAt <= :start AND m.endAt > :start) OR (m.startAt < :end AND m.endAt >= :end) OR (m.startAt >= :start AND m.endAt <= :end))")
    boolean existsOverlappingMaintenance(@Param("resourceId") Long resourceId, 
                                        @Param("start") LocalDateTime start, 
                                        @Param("end") LocalDateTime end);
}
