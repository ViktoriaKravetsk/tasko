package com.tasko.backend.task;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    Optional<Task> findByIdAndProjectId(Long id, Long projectId);

    List<Task> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);

    boolean existsByProjectId(Long projectId);
}
