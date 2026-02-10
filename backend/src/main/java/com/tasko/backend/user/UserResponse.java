package com.tasko.backend.user;

import java.time.Instant;

public record UserResponse(
        Long id,
        String email,
        String name,
        String avatarUrl,
        Instant createdAt
) {
}
