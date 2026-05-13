package com.tasko.backend.notification;

import com.tasko.backend.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationCenterService notificationCenterService;

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal CurrentUser principal) {
        return notificationCenterService.list(principal.getUserId());
    }

    @GetMapping("/unread-count")
    public long unreadCount(@AuthenticationPrincipal CurrentUser principal) {
        return notificationCenterService.unreadCount(principal.getUserId());
    }

    @PutMapping("/{notificationId}/read")
    public NotificationResponse markRead(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long notificationId
    ) {
        return notificationCenterService.markRead(principal.getUserId(), notificationId);
    }

    @PutMapping("/read-all")
    public void markAllRead(@AuthenticationPrincipal CurrentUser principal) {
        notificationCenterService.markAllRead(principal.getUserId());
    }

    @DeleteMapping("/{notificationId}")
    public void delete(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long notificationId
    ) {
        notificationCenterService.delete(principal.getUserId(), notificationId);
    }
}
