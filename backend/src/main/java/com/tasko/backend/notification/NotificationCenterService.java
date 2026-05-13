package com.tasko.backend.notification;

import com.tasko.backend.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationCenterService {

    private final InAppNotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(Long userId) {
        return notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public NotificationResponse markRead(Long userId, Long notificationId) {
        InAppNotification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));

        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }

        return toResponse(notification);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllAsRead(userId, Instant.now());
    }

    @Transactional
    public void delete(Long userId, Long notificationId) {
        InAppNotification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));

        notificationRepository.delete(notification);
    }

    @Transactional
    public void create(
            Long userId,
            NotificationType type,
            String title,
            String message,
            String href,
            Long relatedEntityId
    ) {
        if (userId == null) return;

        notificationRepository.save(InAppNotification.builder()
                .userId(userId)
                .type(type)
                .title(limit(title, 180))
                .message(message == null || message.isBlank() ? title : message)
                .href(href)
                .relatedEntityId(relatedEntityId)
                .build());
    }

    private NotificationResponse toResponse(InAppNotification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getHref(),
                notification.getRelatedEntityId(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.isBlank()) return "Tasko notification";
        String normalized = value.trim();
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength);
    }
}
