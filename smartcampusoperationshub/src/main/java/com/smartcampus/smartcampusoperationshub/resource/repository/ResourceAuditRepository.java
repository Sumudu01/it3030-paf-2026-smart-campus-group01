package com.smartcampus.smartcampusoperationshub.resource.repository;

import com.smartcampus.smartcampusoperationshub.resource.model.ResourceAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResourceAuditRepository extends JpaRepository<ResourceAudit, Long> {
    List<ResourceAudit> findByResourceIdOrderByPerformedAtDesc(Long resourceId);
}
