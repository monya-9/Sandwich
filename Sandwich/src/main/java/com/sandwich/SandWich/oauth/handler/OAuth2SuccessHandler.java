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
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
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

        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new IllegalStateException("OAuth2UserService에서 유저 생성/연동 실패"));

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

        boolean trustedNow = deviceTrustService.isTrusted(request);
        System.out.println("### [OAUTH2] isTrusted=" + trustedNow);

        if (rememberFlag && !trustedNow) {
            deviceTrustService.remember(request, response, user.getId(), deviceName);
            System.out.println("### [OAUTH2] remember() executed (deviceName=" + deviceName + ")");
        } else if (rememberFlag) {
            System.out.println("### [OAUTH2] remember skipped (already trusted)");
        } else {
            System.out.println("### [OAUTH2] remember skipped (flag=false)");
        }


        // ===== 임시 강제 호출(문제 분리용): 아래 한 줄이 DB insert를 만든다면 파이프라인은 정상 ====
        deviceTrustService.remember(request, response, user.getId(), "Temp-Force"); // <-- 테스트 후 제거
        System.out.println("### [OAUTH2] forced remember() called");

        // 정상 경로(플래그 기반)
        if (rememberFlag) {
            deviceTrustService.remember(request, response, user.getId(), deviceName);
            System.out.println("### [OAUTH2] remember() called with deviceName=" + deviceName);
        } else {
            System.out.println("### [OAUTH2] remember skipped (flag=false)");
        }

        String accessToken = jwtUtil.createAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.createRefreshToken(user.getEmail());
        redisUtil.saveRefreshToken(String.valueOf(user.getId()), refreshToken);

        boolean needNickname = (user.getProfile() == null)
                || user.getProfile().getNickname() == null
                || user.getProfile().getNickname().isBlank();

        String redirectUriBase = System.getenv("FRONTEND_URL") != null ? 
        System.getenv("FRONTEND_URL") : "http://localhost:3000";
        String redirectPath = needNickname ? "/oauth/profile-step" : "/oauth2/success";

        String redirectUri = redirectUriBase + redirectPath
                + "?token=" + accessToken
                + "&refreshToken=" + refreshToken
                + "&email=" + user.getEmail()
                + "&provider=" + user.getProvider()
                + "&isProfileSet=" + Boolean.TRUE.equals(user.getIsProfileSet())
                + "&needNickname=" + needNickname;

        response.sendRedirect(redirectUri);
    }
}
