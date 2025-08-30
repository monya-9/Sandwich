package com.sandwich.SandWich.notification.repository;

import com.sandwich.SandWich.notification.domain.Notification;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public class NotificationLedgerRepositoryImpl implements NotificationLedgerRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    @Override
    public List<Notification> findPageByUserId(Long userId, int size, OffsetDateTime cursorAt) {
        String base = """
            select * from notification_ledger
             where user_id = :uid
               %s
             order by created_at desc, id desc
             limit :limit
            """;
        String cond = (cursorAt == null) ? "" : "and created_at < :cursorAt";
        var q = em.createNativeQuery(base.formatted(cond), Notification.class)
                .setParameter("uid", userId)
                .setParameter("limit", size + 1);
        if (cursorAt != null) q.setParameter("cursorAt", cursorAt);
        @SuppressWarnings("unchecked")
        List<Notification> list = q.getResultList();
        return list;
    }
}
