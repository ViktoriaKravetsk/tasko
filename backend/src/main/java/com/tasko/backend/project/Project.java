package com.tasko.backend.project;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "projects")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate deadline;

    @Column(name = "join_code", nullable = false, unique = true, length = 16)
    private String joinCode;

    @Column(name = "join_enabled", nullable = false)
    private boolean joinEnabled = true;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() { normalize(); }

    @PreUpdate
    void preUpdate() { normalize(); }

    private void normalize() {
        if (joinCode != null) joinCode = joinCode.trim().toUpperCase();
        if (name != null) name = name.trim();
        if (description != null) {
            String d = description.trim();
            description = d.isBlank() ? null : d;
        }
    }
}
