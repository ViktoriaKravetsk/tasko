package com.tasko.backend.submission;

import java.time.Instant;

public record SubmissionShortResponse(
        Long id,
        Long taskId,
        Long studentId,
        Instant submittedAt,
        boolean late,
        Integer teacherScore,
        Instant gradedAt
) {}
