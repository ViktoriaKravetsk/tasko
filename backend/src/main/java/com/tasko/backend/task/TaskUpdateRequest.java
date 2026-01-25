package com.tasko.backend.task;

import java.time.LocalDate;

public record TaskUpdateRequest(
        String title,
        String description,
        LocalDate deadline,
        Integer maxScore
) {}
