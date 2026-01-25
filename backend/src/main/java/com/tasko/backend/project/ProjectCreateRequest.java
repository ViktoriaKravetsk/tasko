package com.tasko.backend.project;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record ProjectCreateRequest(
        @NotBlank String name,
        String description,
        LocalDate deadline
) {}
