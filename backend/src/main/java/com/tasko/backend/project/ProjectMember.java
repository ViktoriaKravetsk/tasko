package com.tasko.backend.project;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "project_members",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_project_members_project_user", columnNames = {"project_id", "user_id"})
        },
        indexes = {
                @Index(name = "ix_project_members_user_id", columnList = "user_id"),
                @Index(name = "ix_project_members_project_id", columnList = "project_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectRole role;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;
}
