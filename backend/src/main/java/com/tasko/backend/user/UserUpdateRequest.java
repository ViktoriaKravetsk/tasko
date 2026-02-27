package com.tasko.backend.user;

import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @Size(min = 1, max = 255, message = "Name must be between 1 and 255 characters")
        String name,

        @Size(max = 2048, message = "Avatar URL must be less than 2048 characters")
        String avatarUrl
) {}

