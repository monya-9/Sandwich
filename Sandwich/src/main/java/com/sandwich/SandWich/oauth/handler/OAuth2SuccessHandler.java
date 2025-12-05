package com.sandwich.SandWich.oauth.handler;

import com.sandwich.SandWich.auth.device.DeviceTrustService;
import com.sandwich.SandWich.auth.security.JwtUtil;
import com.sandwich.SandWich.common.util.RedisUtil;
import com.sandwich.SandWich.oauth.model.CustomOAuth2User;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final RedisUtil redisUtil;
    private final DeviceTrustService deviceTrustService;

    private final HttpSessionOAuth2AuthorizationRequestRepository authReqRepo =
            new HttpSessionOAuth2AuthorizationRequestRepository();

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        System.out.println("### [OAUTH2] success handler entered");

        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        String provider = oAuth2User.getProvider();

        String email = oAuth2User.getAttribute("email");
        String username = oAuth2User.getAttribute("login");
        if ((email == null || email.isBlank()) && username != null) {
            email = username + "@" + provider + ".local";
        }

        User user = userRepository.findByEmailAndIsDeletedFalse(email).orElse(null);
        if (user == null) {
            // 여기까지 왔는데 유저가 없으면 에러 페이지로 리다이렉트
            String frontendUrl = Optional.ofNullable(System.getenv("FRONTEND_URL"))
                    .orElse("https://sandwich-dev.com");
            String msg = URLEncoder.encode(
                    "계정 정보를 찾을 수 없습니다. 다시 로그인해 주세요.",
                    StandardCharsets.UTF_8
            );

            String redirectUrl = frontendUrl + "/oauth2/error"
                    + "?provider=" + URLEncoder.encode(provider != null ? provider : "unknown", StandardCharsets.UTF_8)
                    + "&message=" + msg;

            response.sendRedirect(redirectUrl);
            return;
        }
        // ---- optional attributes from authorization request (remember / deviceName)
        OAuth2AuthorizationRequest authReq = authReqRepo.removeAuthorizationRequest(request, response);
        String remember = null;
        String deviceName = "Web Browser";
        if (authReq != null) {
            Map<String, Object> attrs = authReq.getAttributes();
            System.out.println("### [OAUTH2] attrs=" + attrs);
            if (attrs.get("remember") != null) remember = String.valueOf(attrs.get("remember"));
            if (attrs.get("deviceName") != null) {
                String dn = String.valueOf(attrs.get("deviceName")).trim();
                if (!dn.isBlank()) deviceName = dn;
            }
        } else {
            System.out.println("### [OAUTH2] authReq is NULL (attributes 전달 안됨)");
        }

        boolean rememberFlag = "1".equalsIgnoreCase(remember) || "true".equalsIgnoreCase(remember);
        System.out.println("### [OAUTH2] userId=" + user.getId() + " rememberFlag=" + rememberFlag + " deviceName=" + deviceName);

        boolean trustedNow = deviceTrustService.isTrusted(request, user.getId());
        System.out.println("### [OAUTH2] isTrusted=" + trustedNow);

        if (rememberFlag) {
            if (trustedNow) {
                deviceTrustService.extendCurrentDevice(request, user.getId(), 30); // 기존 신뢰기기 연장(30일)
                System.out.println("### [OAUTH2] extend trust 30d");
            } else {
                deviceTrustService.remember(request, response, user.getId(), deviceName);
                System.out.println("### [OAUTH2] remember() executed (deviceName=" + deviceName + ")");
            }
        } else {
            System.out.println("### [OAUTH2] remember skipped (flag=false)");
        }

        // ---- create tokens
        String accessToken = jwtUtil.createAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.createRefreshToken(user.getEmail());
        redisUtil.saveRefreshToken(String.valueOf(user.getId()), refreshToken);

        String tokenSameSite = System.getenv().getOrDefault("TOKEN_COOKIE_SAMESITE", "None");
        boolean tokenSecure  = Boolean.parseBoolean(System.getenv().getOrDefault("TOKEN_COOKIE_SECURE", "true"));
        String tokenDomain   = System.getenv().getOrDefault("TOKEN_COOKIE_DOMAIN", "");

        ResponseCookie.ResponseCookieBuilder acb = ResponseCookie.from("ACCESS_TOKEN", accessToken)
                .httpOnly(true)
                .secure(tokenSecure)
                .sameSite(tokenSameSite)
                .path("/")
                .maxAge(Duration.ofHours(1));

        ResponseCookie.ResponseCookieBuilder rcb = ResponseCookie.from("REFRESH_TOKEN", refreshToken)
                .httpOnly(true)
                .secure(tokenSecure)
                .sameSite(tokenSameSite)
                .path("/")
                .maxAge(Duration.ofDays(14));

        if (tokenDomain != null && !tokenDomain.isBlank()) {
            acb = acb.domain(tokenDomain);
            rcb = rcb.domain(tokenDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, acb.build().toString());
        response.addHeader(HttpHeaders.SET_COOKIE, rcb.build().toString());

        boolean needNickname = (user.getProfile() == null)
                || user.getProfile().getNickname() == null
                || user.getProfile().getNickname().isBlank();

        String redirectUriBase = System.getenv("FRONTEND_URL") != null
                ? System.getenv("FRONTEND_URL")
                : "https://sandwich-dev.com"; // 운영 기본값 권장

        String redirectPath = needNickname ? "/oauth/profile-step" : "/oauth2/success";

        // 토큰/리프레시토큰은 쿠키로 이미 내려갔으므로 URL에 실지 않음
        String redirectUri = redirectUriBase + redirectPath
                + "?email=" + user.getEmail()
                + "&provider=" + user.getProvider()
                + "&isProfileSet=" + Boolean.TRUE.equals(user.getIsProfileSet())
                + "&needNickname=" + needNickname;

        response.sendRedirect(redirectUri);
    }
}