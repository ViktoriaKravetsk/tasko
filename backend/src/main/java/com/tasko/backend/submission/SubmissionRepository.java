package com.tasko.backend.submission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByTaskIdAndStudentId(Long taskId, Long studentId);

    List<Submission> findAllByTaskIdOrderBySubmittedAtDesc(Long taskId);

    void deleteAllByTaskId(Long taskId);

    void deleteAllByTaskIdIn(Collection<Long> taskIds);

    List<Submission> findAllByTaskIdInAndStudentId(Collection<Long> taskIds, Long studentId);

    @Query("""
            select coalesce(sum(coalesce(s.teacherScore, 0)), 0)
            from Submission s
            join Task t on t.id = s.taskId
            where t.projectId = :projectId
              and s.studentId = :studentId
            """)
    int sumEarnedScore(@Param("projectId") Long projectId, @Param("studentId") Long studentId);

    @Query("""
            select s
            from Submission s
            where s.taskId = :taskId
            order by s.submittedAt desc
            """)
    List<Submission> findByTaskIdForOwner(@Param("taskId") Long taskId);

    @Query("""
            select s
            from Submission s, User u
            where s.studentId = u.id
              and s.taskId = :taskId
              and lower(u.name) like concat('%', lower(:search), '%')
            order by s.submittedAt desc
            """)
    List<Submission> findByTaskIdForOwnerAndSearch(
            @Param("taskId") Long taskId,
            @Param("search") String search
    );
}