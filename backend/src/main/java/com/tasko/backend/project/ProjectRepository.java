package com.tasko.backend.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Project> findByOwnerIdAndNameContainingIgnoreCaseOrderByCreatedAtDesc(Long ownerId, String name);

    Page<Project> findByOwnerId(Long ownerId, Pageable pageable);

    Page<Project> findByOwnerIdAndNameContainingIgnoreCase(Long ownerId, String name, Pageable pageable);

    boolean existsByJoinCode(String joinCode);

    Optional<Project> findByJoinCode(String joinCode);
}
