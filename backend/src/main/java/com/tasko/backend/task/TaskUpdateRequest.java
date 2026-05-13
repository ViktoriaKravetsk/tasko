package com.tasko.backend.task;

import java.time.LocalDate;

public record TaskUpdateRequest(
        String title,
        String description,
        LocalDate deadline,
        Integer maxScore,
        Boolean allowResubmissionAfterGrade
) {
    public TaskUpdateRequest(String title, String description, LocalDate deadline, Integer maxScore) {
        this(title, description, deadline, maxScore, null);
    }
}
