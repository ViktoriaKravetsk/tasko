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

    List<Submission> findAllByTaskIdInAndStudentId(Collection<Long> taskIds, Long studentId);

    @Query("""
select coalesce(sum(coalesce(s.teacherScore, 0)), 0)
from Submission s
join Task t on t.id = s.taskId
where t.projectId = :projectId
  and s.studentId = :studentId
""")
    int sumEarnedScore(@Param("projectId") Long projectId, @Param("studentId") Long studentId);

}
