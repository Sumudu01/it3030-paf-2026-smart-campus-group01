package com.smartcampus.smartcampusoperationshub.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String description;

    private String location;

    //CHANGED FROM ENUM TO STRING
    private String status;

    //CHANGED FROM ENUM TO STRING
    private String priority;

    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}