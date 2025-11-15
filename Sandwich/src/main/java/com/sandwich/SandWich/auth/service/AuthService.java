package com.sandwich.SandWich.auth.service;

import com.sandwich.SandWich.auth.audit.SecurityAuditService;
import com.sandwich.SandWich.auth.device.DeviceTrustService;
import com.sandwich.SandWich.auth.dto.LoginRequest;
import com.sandwich.SandWich.auth.dto.MfaRequiredResponse;
import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.auth.dto.TokenResponse;
import com.sandwich.SandWich.auth.mfa.MfaProperties;
import com.sandwich.SandWich.auth.mfa.OtpContext;
import com.sandwich.SandWich.auth.mfa.OtpService;
import com.sandwich.SandWich.auth.security.JwtUtil;
import com.sandwich.SandWich.common.exception.exceptiontype.*;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.email.service.LoginOtpMailService;
import com.sandwich.SandWich.user.domain.Role;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final RedisUtil redisUtil;

    private final DeviceTrustService deviceTrustService;
    private final OtpService otpService;
    private final LoginOtpMailService loginOtpMailService;
    private final MfaProperties mfaProperties;
    private final SecurityAuditService audit;

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);


    private String generateUniqueUsername() {
        String base;
        do {
            base = "user_" + UUID.randomUUID().toString().substring(0, 8);
        } while (userRepository.existsByUsername(base));
        return base;
    }

    private void validateSignup(SignupRequest req) {
        String verified = redisUtil.getValue("email:verified:" + req.getEmail());

        if (!"true".equals(verified)) {
            throw new EmailVerificationExpiredException();
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new EmailAlreadyExistsException();
        }

        if (req.getPositionId() == null) {
            throw new MissingFieldException("포지션");
        }

        if (req.getInterestIds() == null || req.getInterestIds().isEmpty()) {
            throw new MissingFieldException("관심 분야");
        }
    }

    public void signup(SignupRequest req) {
        validateSignup(req);
        // username 자동 생성
        String username = generateUniqueUsername();
        User user = User.builder()
                .email(req.getEmail())
                .username(username)
                .password(passwordEncoder.encode(req.getPassword()))
                .provider("local")
                .isVerified(true)
                .role(Role.ROLE_USER)
                .build();

        userRepository.save(user); // 1. 유저 저장
        userService.saveBasicProfile(user, req); // 2. nickname 포함한 profile 생성
        redisUtil.deleteValue("email:verified:" + req.getEmail());  // 3. 인증 완료 처리
    }

    public Object login(LoginRequest req, HttpServletRequest httpReq, HttpServletResponse httpRes) {

        // 0) 존재 여부
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(UserNotFoundException::new);

        // 1) 인터랙티브 로그인 가드
        if (user.getUserType() != com.sandwich.SandWich.user.domain.UserType.HUMAN
                || !user.isInteractiveLoginEnabled()) {
            log.warn("[LOGIN][BLOCK] interactive login disabled. email={}, userType={}, interactive={}",
                    user.getEmail(), user.getUserType(), user.isInteractiveLoginEnabled());
            throw new AccessDeniedException("이 계정은 대화형 로그인이 비활성화되었습니다.");
        }

        // 2) provider 체크 (소셜 가입자는 로컬 로그인 불가)
        if (user.getProvider() != null && !"local".equalsIgnoreCase(user.getProvider())) {
            throw new BadRequestException("SOCIAL_LOGIN_ONLY", "소셜 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요.");
        }

        // 3) 계정 상태 체크
        if (user.isDeleted()) {
            throw new UserDeletedException();
        }
        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new UnverifiedUserException();
        }

        // 4) 비밀번호 확인
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new InvalidPasswordException();
        }

        // === 전역 Feature Flag: 꺼져 있으면 2FA 생략 ===
        if (!mfaProperties.isEnabled()) {
            String accessToken = jwtUtil.createAccessToken(user.getEmail(), user.getRole().name());
            String refreshToken = jwtUtil.createRefreshToken(user.getEmail());
            redisUtil.saveRefreshToken(String.valueOf(user.getId()), refreshToken);

            // ✅ 쿠키로 토큰 전달
            setTokenCookies(httpRes, accessToken, refreshToken);

            log.info("[LOGIN] MFA_ENABLED=false → issue tokens immediately. userId={}", user.getId());
            return new TokenResponse(accessToken, refreshToken, "local");
        }

        // 5) Trusted Device면 즉시 토큰 발급
        if (deviceTrustService.isTrusted(httpReq, user.getId())) {
            String accessToken = jwtUtil.createAccessToken(user.getEmail(), user.getRole().name());
            String refreshToken = jwtUtil.createRefreshToken(user.getEmail());
            redisUtil.saveRefreshToken(String.valueOf(user.getId()), refreshToken);
            
            // ✅ 쿠키로 토큰 전달
            setTokenCookies(httpRes, accessToken, refreshToken);
            
            return new TokenResponse(accessToken, refreshToken, "local");
        }

        // 6) 미신뢰 → MFA_REQUIRED
        String pendingId = UUID.randomUUID().toString();

        // OTP 컨텍스트 저장
        OtpContext ctx = OtpContext.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .provider(user.getProvider())
                .ip(httpReq.getRemoteAddr())
                .ua(httpReq.getHeader("User-Agent"))
                .build();
        otpService.saveContext(pendingId, ctx);

        // 코드 발급 + 메일 전송
        String code = otpService.issueCode(pendingId);
        loginOtpMailService.sendLoginOtp(user.getEmail(), code);

        audit.record("OTP_ISSUE", user.getId(), user.getEmail(), pendingId,
                "issued=true", httpReq);

        return new MfaRequiredResponse("MFA_REQUIRED", pendingId, ctx.getMaskedEmail());
    }

    // ✅ 쿠키 헬퍼 메서드
    private void setTokenCookies(HttpServletResponse res, String accessToken, String refreshToken) {
        String sameSite = System.getenv().getOrDefault("TOKEN_COOKIE_SAMESITE", "None");
        boolean secure  = Boolean.parseBoolean(System.getenv().getOrDefault("TOKEN_COOKIE_SECURE", "true"));
        String domain   = System.getenv().getOrDefault("TOKEN_COOKIE_DOMAIN", "");

        addTokenCookie(res, "ACCESS_TOKEN", accessToken, 60 * 60, sameSite, secure, domain);
        addTokenCookie(res, "REFRESH_TOKEN", refreshToken, 14 * 24 * 60 * 60, sameSite, secure, domain);
    }

    private void addTokenCookie(HttpServletResponse res,
                                String name, String value, int maxAgeSeconds,
                                String sameSite, boolean secure, String domain) {
        var builder = org.springframework.http.ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSeconds));
        if (domain != null && !domain.isBlank()) builder = builder.domain(domain);
        res.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    public void logout(String accessToken) {
        String username = jwtUtil.extractUsername(accessToken);
        User user = userRepository.findByEmailAndIsDeletedFalse(username)
                .orElseThrow(() -> new UsernameNotFoundException("유저를 찾을 수 없습니다."));
        redisUtil.deleteRefreshToken(String.valueOf(user.getId()));
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 3) return "***" + email.substring(at);
        return email.substring(0, 3) + "****" + email.substring(at);
    }

}