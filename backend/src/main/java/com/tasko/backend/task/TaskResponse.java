package com.tasko.backend.task;

import java.time.Instant;
import java.time.LocalDate;

public record TaskResponse(
        Long id,
        Long projectId,
        String title,
        String description,
        LocalDate deadline,
        Integer maxScore,
        TaskStatus status,
        Instant createdAt,
        Instant updatedAt
) {}
