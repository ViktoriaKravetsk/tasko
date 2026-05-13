package com.tasko.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface InAppNotificationRepository extends JpaRepository<InAppNotification, Long> {

    List<InAppNotification> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndReadAtIsNull(Long userId);

    Optional<InAppNotification> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("""
            update InAppNotification n
            set n.readAt = :readAt
            where n.userId = :userId
              and n.readAt is null
            """)
    int markAllAsRead(@Param("userId") Long userId, @Param("readAt") Instant readAt);
}
