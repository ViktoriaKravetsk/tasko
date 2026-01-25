package com.tasko.backend.project;

import jakarta.validation.constraints.NotBlank;

public record ProjectJoinRequest(
        @NotBlank String joinCode
) {}
