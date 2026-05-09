package com.tasko.backend.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<Task> findByProjectIdAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(Long projectId, String title);

    Optional<Task> findByIdAndProjectId(Long id, Long projectId);

    List<Task> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);

    boolean existsByProjectId(Long projectId);

    @Query("select coalesce(sum(t.maxScore), 0) from Task t where t.projectId = :projectId")
    int sumMaxScoreByProjectId(@Param("projectId") Long projectId);

    @Query("select t.id from Task t where t.projectId = :projectId")
    List<Long> findIdsByProjectId(@Param("projectId") Long projectId);

    void deleteAllByProjectId(Long projectId);

    List<Task> findAllByDeadline(LocalDate deadline);

    @Query("""
            select t
            from Task t
            where t.projectId = :projectId
              and t.deadline is not null
              and t.deadline < :today
            order by t.createdAt desc
            """)
    List<Task> findOverdueByProjectId(@Param("projectId") Long projectId, @Param("today") LocalDate today);

    @Query("""
            select t
            from Task t
            where t.projectId = :projectId
              and t.deadline is not null
              and t.deadline >= :today
            order by t.createdAt desc
            """)
    List<Task> findUpcomingByProjectId(@Param("projectId") Long projectId, @Param("today") LocalDate today);

    @Query("""
            select t
            from Task t
            where t.projectId = :projectId
              and t.deadline is null
            order by t.createdAt desc
            """)
    List<Task> findNoDeadlineByProjectId(@Param("projectId") Long projectId);

    @Query("""
            select t
            from Task t
            where t.projectId = :projectId
              and lower(t.title) like concat('%', lower(:search), '%')
              and t.deadline is not null
              and t.deadline < :today
            order by t.createdAt desc
            """)
    List<Task> findOverdueByProjectIdAndSearch(
            @Param("projectId") Long projectId,
            @Param("search") String search,
            @Param("today") LocalDate today
    );

    @Query("""
            select t
            from Task t
            where t.projectId = :projectId
              and lower(t.title) like concat('%', lower(:search), '%')
              and t.deadline is not null
              and t.deadline >= :today
            order by t.createdAt desc
            """)
    List<Task> findUpcomingByProjectIdAndSearch(
            @Param("projectId") Long projectId,
            @Param("search") String search,
            @Param("today") LocalDate today
    );

    @Query("""
            select t
            from Task t
            where t.projectId = :projectId
              and lower(t.title) like concat('%', lower(:search), '%')
              and t.deadline is null
            order by t.createdAt desc
            """)
    List<Task> findNoDeadlineByProjectIdAndSearch(
            @Param("projectId") Long projectId,
            @Param("search") String search
    );
}