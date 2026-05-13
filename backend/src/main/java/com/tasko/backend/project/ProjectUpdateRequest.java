package com.tasko.backend.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ProjectUpdateRequest(
        @NotBlank String name,
        String emoji,
        @Size(max = 200, message = "Description must be 200 characters or less")
        String description,
        LocalDate deadline
) {}
