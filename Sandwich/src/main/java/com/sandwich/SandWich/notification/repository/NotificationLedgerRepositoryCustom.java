package com.sandwich.SandWich.notification.repository;

import com.sandwich.SandWich.notification.domain.Notification;
import java.time.OffsetDateTime;
import java.util.List;

public interface NotificationLedgerRepositoryCustom {
    List<Notification> findPageByUserId(Long userId, int size, OffsetDateTime cursorAt);
}