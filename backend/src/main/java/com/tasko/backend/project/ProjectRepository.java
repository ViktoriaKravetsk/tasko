package com.tasko.backend.project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    boolean existsByJoinCode(String joinCode);
    Optional<Project> findByJoinCode(String joinCode);

}
