package com.smartcampus.smartcampusoperationshub.resource.repository;

import com.smartcampus.smartcampusoperationshub.resource.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
    @Query("SELECT r FROM Resource r WHERE " +
           "(:type IS NULL OR r.type = :type) AND " +
           "(:location IS NULL OR r.location LIKE %:location%) AND " +
           "(:minCapacity IS NULL OR r.capacity >= :minCapacity)")
    List<Resource> searchResources(@Param("type") String type, 
                                 @Param("location") String location, 
                                 @Param("minCapacity") Integer minCapacity);

    List<Resource> findByStatus(Resource.ResourceStatus status);
}
