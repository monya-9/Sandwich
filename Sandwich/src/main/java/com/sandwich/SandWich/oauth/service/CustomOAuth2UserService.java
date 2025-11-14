package com.sandwich.SandWich.oauth.service;

import com.sandwich.SandWich.oauth.model.CustomOAuth2User;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    private String ensureUniqueUsername(String base) {
        String candidate = base;
        int seq = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "_" + seq++;
        }
        return candidate;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = super.loadUser(request);

        String provider = request.getClientRegistration().getRegistrationId();
        String email = oauthUser.getAttribute("email");
        String username;

        // 1) provider별 username 원천
        if ("google".equals(provider)) {
            username = oauthUser.getAttribute("name");
            if (username == null || username.isBlank()) {
                username = oauthUser.getAttribute("given_name");
            }
            if (username == null || username.isBlank()) {
                username = (email != null && !email.isBlank())
                        ? email.split("@")[0]
                        : "googleUser";
            }
        } else { // github 등
            username = oauthUser.getAttribute("login");
        }

        // 2) 이메일 폴백
        if (email == null || email.isBlank()) {
            String base = (username != null && !username.isBlank()) ? username : provider + "User";
            email = base + "@" + provider + ".local";
        }

        // 3) 이메일 중복 + provider 불일치 차단
        Optional<User> byEmail = userRepository.findByEmailAndIsDeletedFalse(email);
        if (byEmail.isPresent() && !byEmail.get().getProvider().equals(provider)) {
            log.warn("중복 이메일 시도: email={}, 기존 provider={}, 시도 provider={}",
                    email, byEmail.get().getProvider(), provider);

            OAuth2Error error = new OAuth2Error(
                    "email_already_exists",
                    "이미 다른 로그인 방식으로 가입된 이메일입니다.",
                    null
            );
            throw new OAuth2AuthenticationException(error);
        }

        // 4) provider+email로 기존 계정 조회
        Optional<User> existingUser =
                userRepository.findByEmailAndProviderAndIsDeletedFalse(email, provider);

        // 없으면 새로 생성 (소셜 회원가입)
        if (existingUser.isEmpty()) {
            log.info("소셜 회원가입됨: {} ({})", email, provider);

            String baseUsername = (username != null && !username.isBlank())
                    ? username
                    : email.split("@")[0];
            String uniqueUsername = ensureUniqueUsername(baseUsername);

            User newUser = User.builder()
                    .email(email)
                    .username(uniqueUsername)
                    .provider(provider)
                    .password(null)
                    .isVerified(true)
                    .build();

            try {
                userRepository.save(newUser);
            } catch (DataIntegrityViolationException e) {
                log.error("소셜 회원가입 중 DB 제약 위반 발생 email={}, provider={}", email, provider, e);
                OAuth2Error error = new OAuth2Error(
                        "social_signup_failed",
                        "소셜 계정 연동 중 오류가 발생했습니다.",
                        null
                );
                throw new OAuth2AuthenticationException(error, e);
            }
        }

        // 5) nameAttributeKey 결정 (email 선호, 없으면 login)
        String nameAttributeKey = (oauthUser.getAttribute("email") != null) ? "email" : "login";

        return new CustomOAuth2User(
                provider,
                new DefaultOAuth2User(
                        Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                        oauthUser.getAttributes(),
                        nameAttributeKey
                )
        );
    }
}
