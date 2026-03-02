package com.tasko.backend.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    Optional<Task> findByIdAndProjectId(Long id, Long projectId);

    List<Task> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);

    boolean existsByProjectId(Long projectId);

    @Query("select coalesce(sum(t.maxScore), 0) from Task t where t.projectId = :projectId")
    int sumMaxScoreByProjectId(@Param("projectId") Long projectId);

    @Query("select t.id from Task t where t.projectId = :projectId")
    List<Long> findIdsByProjectId(@Param("projectId") Long projectId);

    void deleteAllByProjectId(Long projectId);

}
