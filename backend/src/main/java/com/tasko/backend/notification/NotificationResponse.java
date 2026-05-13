package com.tasko.backend.notification;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        String href,
        Long relatedEntityId,
        Instant readAt,
        Instant createdAt
) {}
