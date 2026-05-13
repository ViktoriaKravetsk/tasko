package com.tasko.backend.task;

import java.time.Instant;
import java.time.LocalDate;

public record TaskShortResponse(
        Long id,
        Long projectId,
        String title,
        String description,
        TaskStatus status,
        LocalDate deadline,
        Integer maxScore,
        boolean allowResubmissionAfterGrade,
        Instant createdAt,
        Instant updatedAt
) {}
