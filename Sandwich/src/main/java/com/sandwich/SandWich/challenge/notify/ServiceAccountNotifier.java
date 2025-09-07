package com.sandwich.SandWich.challenge.notify;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service @RequiredArgsConstructor
@ConditionalOnProperty(
        name = {"ops.system-notify.enabled","ops.service-notify.enabled"},
        havingValue = "true",
        matchIfMissing = true
)
public class ServiceAccountNotifier {
    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper om;

    @Value("${app.system.user-id:${app.service.user-id:#{null}}}")
    private Long systemUserId;

    public void onSubmissionCreated(Long subId, Long chId, Long ownerId, String title, String repo, String demo) {
        if (systemUserId == null) return; // 프로퍼티 없으면 조용히 미동작
        try {
            jdbc.update("""
                insert into service_notification (target_user_id, type, ref_type, ref_id, payload)
                values (:uid, 'SUBMISSION_CREATED', 'SUBMISSION', :rid, cast(:payload as jsonb))
                on conflict (type, ref_type, ref_id) do nothing
            """, Map.of(
                    "uid", systemUserId,
                    "rid", subId,
                    "payload", om.writeValueAsString(Map.of(
                            "challengeId", chId, "ownerId", ownerId, "title", title, "repoUrl", repo, "demoUrl", demo
                    ))
            ));
        } catch (Exception ignore) { /* 실패해도 본 흐름 막지 않음 */ }
    }

    public void onChallengeLifecycle(Long chId, ChallengeType type, ChallengeStatus prev, ChallengeStatus next) {
        if (systemUserId == null) return;
        try {
            jdbc.update("""
            insert into service_notification (target_user_id, type, ref_type, ref_id, payload)
            values (:uid, 'CHALLENGE_LIFECYCLE', 'CHALLENGE', :rid, cast(:payload as jsonb))
            on conflict (type, ref_type, ref_id) do nothing
        """, Map.of(
                    "uid", systemUserId,
                    "rid", chId,
                    "payload", om.writeValueAsString(Map.of(
                            "challengeId", chId, "from", prev.name(), "to", next.name(), "challengeType", type.name()
                    ))
            ));
        } catch (Exception ignore) {}
    }

}
