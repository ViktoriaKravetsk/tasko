package com.tasko.backend.project;

import java.time.Instant;
import java.time.LocalDate;

public record ProjectResponse(
        Long id,
        String name,
        String description,
        LocalDate deadline,
        String joinCode,
        boolean active,
        Instant createdAt
) {}
