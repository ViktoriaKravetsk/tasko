package com.tasko.backend.task;

import java.time.LocalDate;

public record TaskCreateRequest(
        String title,
        String description,
        LocalDate deadline,
        Integer maxScore
) {}
