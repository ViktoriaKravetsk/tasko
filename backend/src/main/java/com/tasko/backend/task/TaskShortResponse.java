package com.tasko.backend.task;

import java.time.Instant;
import java.time.LocalDate;

public record TaskShortResponse(
        Long id,
        Long projectId,
        String title,
        TaskStatus status,
        LocalDate deadline,
        Instant createdAt,
        Instant updatedAt
) {}
