package com.tasko.backend.submission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByTaskIdAndStudentId(Long taskId, Long studentId);

    List<Submission> findAllByTaskIdOrderBySubmittedAtDesc(Long taskId);

    List<Submission> findAllByTaskIdInAndStudentId(Collection<Long> taskIds, Long studentId);
}
