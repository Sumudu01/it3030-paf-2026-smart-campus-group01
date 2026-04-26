package com.smartcampus.smartcampusoperationshub.resource.repository;

import com.smartcampus.smartcampusoperationshub.resource.model.ResourceClosure;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ResourceClosureRepository extends JpaRepository<ResourceClosure, Long> {
    List<ResourceClosure> findByResourceId(Long resourceId);
    Optional<ResourceClosure> findByResourceIdAndClosureDate(Long resourceId, LocalDate date);
}
