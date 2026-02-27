package com.tasko.backend.submission;

import java.time.Instant;

public record SubmissionResponse(
        Long id,
        Long taskId,
        Long studentId,
        String studentName,
        String textAnswer,
        String fileLink,
        Instant submittedAt,
        boolean late,
        Integer teacherScore,
        String teacherComment,
        Instant gradedAt,
        Integer aiScore,
        String aiComment,
        Instant aiEvaluatedAt,
        SubmissionStatus status
) {}

