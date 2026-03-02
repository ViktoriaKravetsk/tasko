package com.tasko.backend.task;

import com.tasko.backend.submission.SubmissionStatus;

import java.time.Instant;
import java.time.LocalDate;

public record TaskMyResponse(
        Long id,
        Long projectId,
        String title,
        SubmissionStatus myStatus,
        Integer myTeacherScore,
        LocalDate deadline,
        Instant createdAt,
        Instant updatedAt
) {}
