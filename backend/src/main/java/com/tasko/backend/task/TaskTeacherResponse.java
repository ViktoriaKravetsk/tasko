package com.tasko.backend.task;

import java.time.LocalDate;

public record TaskTeacherResponse(
        Long id,
        Long projectId,
        String title,
        LocalDate deadline,
        Integer maxScore,
        long submittedCount,
        long gradedCount
) {}
