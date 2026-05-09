package com.tasko.backend.project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Project> findByOwnerIdAndNameContainingIgnoreCaseOrderByCreatedAtDesc(Long ownerId, String name);

    boolean existsByJoinCode(String joinCode);

    Optional<Project> findByJoinCode(String joinCode);
}