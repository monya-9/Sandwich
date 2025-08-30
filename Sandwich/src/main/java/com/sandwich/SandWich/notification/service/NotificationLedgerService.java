package com.sandwich.SandWich.notification.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.notification.domain.Notification;
import com.sandwich.SandWich.notification.dto.*;
import com.sandwich.SandWich.notification.repository.NotificationLedgerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationLedgerService {

    private final NotificationLedgerRepository repo;
    private final ObjectMapper om;

    // 팬아웃에서 항상 호출 (푸시/이메일 선호도와 무관)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveFromPayload(NotifyPayload p) {

        log.info("[LEDGER] saveFromPayload target={} event={}", p.getTargetUserId(), p.getEvent());

        String extraJson = null;
        if (p.getExtra() != null) {
            try { extraJson = om.writeValueAsString(p.getExtra()); }
            catch (Exception e) { extraJson = "{}"; }
        }
        OffsetDateTime createdAt = (p.getCreatedAt() != null)
                ? p.getCreatedAt() : OffsetDateTime.now(ZoneOffset.UTC);

        String rType = "SYSTEM";
        Long   rId   = 0L;
        if (p.getResource() != null) {
            if (p.getResource().getType() != null) rType = p.getResource().getType();
            if (p.getResource().getId()   != null) rId   = p.getResource().getId();
        }

        Notification e = Notification.builder()
                .userId(p.getTargetUserId())
                .event(Objects.toString(p.getEvent(), "EVENT"))
                .resourceType(rType)
                .resourceId(rId)
                .title(Optional.ofNullable(p.getTitle()).orElse(p.getBody()))
                .body(Optional.ofNullable(p.getBody()).orElse(""))
                .deepLink(Optional.ofNullable(p.getDeepLink()).orElse("/"))
                .extra(p.getExtra())
                .read(false)
                .build();

        // BaseEntity.created_at을 직접 세팅하는 구조가 아니라면 save()만
        repo.save(e);
        repo.flush();
        long after = repo.countUnread(p.getTargetUserId());
        log.info("[LEDGER] saveFromPayload OUT id={}", e.getId());
    }

    // ==== Count ====
    @Transactional(readOnly = true)
    public UnreadCountResponse unreadCount(Long userId) {
        log.info("[LEDGER] unread-count uid={}", userId);
        return new UnreadCountResponse(repo.countUnread(userId)); // ← 여기만 변경
    }

    // ==== List (cursor: epochMillis, created_at DESC) ====
    @Transactional(readOnly = true)
    public NotificationListResponse list(Long userId, Integer size, String cursorEpochMillis) {
        int s = (size == null) ? 20 : Math.max(1, Math.min(size, 50));
        OffsetDateTime cursorAt = null;
        if (cursorEpochMillis != null && !cursorEpochMillis.isBlank()) {
            long epoch = Long.parseLong(cursorEpochMillis);
            cursorAt = OffsetDateTime.ofInstant(Instant.ofEpochMilli(epoch), ZoneOffset.UTC);
        }

        var rows = repo.findPageByUserId(userId, s, cursorAt);

        boolean hasNext = rows.size() > s;
        if (hasNext) rows = rows.subList(0, s);

        String nextCursor = null;
        if (hasNext && !rows.isEmpty()) {
            var last = rows.get(rows.size() - 1);
            // BaseEntity.getCreatedAt() 사용
            long nextEpoch = last.getCreatedAt().toInstant().toEpochMilli();
            nextCursor = String.valueOf(nextEpoch);
        }

        var items = rows.stream().map(n ->
                NotificationItemDTO.builder()
                        .id(n.getId())
                        .event(n.getEvent())
                        .title(n.getTitle())
                        .body(n.getBody())
                        .resource(new NotificationItemDTO.Resource(n.getResourceType(), n.getResourceId()))
                        .deepLink(n.getDeepLink())
                        .extra(n.getExtra())
                        .read(n.isRead())
                        .createdAt(n.getCreatedAt())
                        .build()
        ).collect(Collectors.toList());

        return new NotificationListResponse(items, nextCursor);
    }

    // ==== Mark read (some) ====
    @Transactional
    public MarkReadResponse markRead(Long userId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            long unread = repo.countByUserIdAndReadFalse(userId);
            return new MarkReadResponse(0, unread);
        }
        int updated = repo.markReadIn(userId, ids);
        long unread = repo.countByUserIdAndReadFalse(userId);
        return new MarkReadResponse(updated, unread);
    }

    // ==== Mark all ====
    @Transactional
    public MarkReadResponse markAll(Long userId) {
        int updated = repo.markAllRead(userId);
        long unread = repo.countByUserIdAndReadFalse(userId);
        return new MarkReadResponse(updated, unread);
    }

    // ==== util ====
    private Map<String,Object> parseJsonMap(String json) {
        if (json == null || json.isBlank()) return null;
        try { return om.readValue(json, new TypeReference<>(){}); }
        catch (Exception e) { return null; }
    }
}
