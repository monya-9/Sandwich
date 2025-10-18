package com.sandwich.SandWich.auth.mfa;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.auth.mfa.metrics.OtpMetrics;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import lombok.extern.slf4j.Slf4j;
import java.util.concurrent.TimeUnit;
import java.security.SecureRandom;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    // 꼭 StringRedisTemplate로!
    private final @Qualifier("stringRedisTemplate") StringRedisTemplate redis;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom rnd = new SecureRandom();
    private final ObjectMapper om = new ObjectMapper();
    private final OtpMetrics metrics;

    // Redis Keys
    private static String K_CODE(String pid)    { return "otp:code:" + pid; }      // bcrypt(code), 5분
    private static String K_ATTEMPT(String pid) { return "otp:try:"  + pid; }      // 시도수, 10분
    private static String K_CTX(String pid)     { return "otp:ctx:"  + pid; }      // OtpContext JSON, 5분

    public String issueCode(String pendingId) {
        try {
            return metrics.timeIssue(() -> {
                String code = String.format("%06d", rnd.nextInt(1_000_000));
                String codeKey = K_CODE(pendingId);

                redis.opsForValue().set(codeKey, encoder.encode(code), Duration.ofMinutes(5));
                redis.opsForValue().setIfAbsent(K_ATTEMPT(pendingId), "0", Duration.ofMinutes(10));
                Long ttlSec = redis.getExpire(codeKey, TimeUnit.SECONDS);

                log.info("otp.issue success pid={} ttlSec={} codeKey={} ctxKey={}",
                        pendingId, ttlSec, codeKey, K_CTX(pendingId));
                metrics.incIssued();
                return code;
            });
        } catch (Exception e) {
            log.warn("otp.issue fail pid={} msg={}", pendingId, e.getMessage());
            throw e;
        }
    }

    public void saveContext(String pendingId, OtpContext ctx) {
        try {
            redis.opsForValue().set(K_CTX(pendingId), om.writeValueAsString(ctx), Duration.ofMinutes(5));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public OtpContext loadContext(String pendingId) {
        try {
            String s = redis.opsForValue().get(K_CTX(pendingId));
            return (s == null) ? null : om.readValue(s, new TypeReference<>() {});
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public enum VerifyResult { OK, INVALID, EXPIRED, LOCKED }

    public VerifyResult verifyDetailed(String pendingId, String code, int maxTries) {
        try {
            return metrics.timeVerify(() -> {
                if (pendingId == null || code == null) {
                    log.info("otp.verify expired pid={} reason=null_input", pendingId);
                    metrics.incVerifyExpired();
                    return VerifyResult.EXPIRED;
                }

                String codeKey = K_CODE(pendingId);
                String tryKey  = K_ATTEMPT(pendingId);

                String hash = redis.opsForValue().get(codeKey);
                Long ttlSec = redis.getExpire(codeKey, TimeUnit.SECONDS);
                String triesStr = redis.opsForValue().get(tryKey);
                int tries = (triesStr == null) ? 0 : Integer.parseInt(triesStr);

                if (hash == null) {
                    log.info("otp.verify expired pid={} ttl=null", pendingId);
                    metrics.incVerifyExpired();
                    return VerifyResult.EXPIRED;
                }
                if (tries >= maxTries) {
                    log.info("otp.verify locked pid={} tries={}", pendingId, tries);
                    metrics.incVerifyLocked();
                    return VerifyResult.LOCKED;
                }

                boolean ok = encoder.matches(code, hash);
                if (ok) {
                    redis.delete(codeKey);
                    redis.delete(tryKey);
                    log.info("otp.verify ok pid={} ttlSec={} tries={}", pendingId, ttlSec, tries);
                    metrics.incVerifyOk();
                    return VerifyResult.OK;
                } else {
                    redis.opsForValue().increment(tryKey);
                    log.info("otp.verify invalid pid={} ttlSec={} tries={}", pendingId, ttlSec, tries+1);
                    metrics.incVerifyInvalid();
                    return VerifyResult.INVALID;
                }
            });
        } catch (Exception e) {
            log.warn("otp.verify error pid={} msg={}", pendingId, e.getMessage());
            throw e;
        }
    }

    public OtpContext popContext(String pendingId) {
        try {
            String s = redis.opsForValue().getAndDelete(K_CTX(pendingId)); // get + delete
            return (s == null) ? null : om.readValue(s, new TypeReference<>() {});
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // 모두 정리하는 헬퍼
    public void clearAll(String pendingId) {
        redis.delete(K_CODE(pendingId));
        redis.delete(K_ATTEMPT(pendingId));
        redis.delete(K_CTX(pendingId));
    }
}
