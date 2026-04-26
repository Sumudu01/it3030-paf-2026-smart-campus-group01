package com.smartcampus.smartcampusoperationshub.resource.repository;

import com.smartcampus.smartcampusoperationshub.resource.model.ResourceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResourceScheduleRepository extends JpaRepository<ResourceSchedule, Long> {
    List<ResourceSchedule> findByResourceId(Long resourceId);
    List<ResourceSchedule> findByResourceIdAndDayOfWeek(Long resourceId, Integer dayOfWeek);
}
