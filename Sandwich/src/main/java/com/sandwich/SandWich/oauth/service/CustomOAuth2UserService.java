package com.sandwich.SandWich.oauth.service;

import com.sandwich.SandWich.global.exception.exceptiontype.EmailAlreadyExistsException;
import com.sandwich.SandWich.oauth.model.CustomOAuth2User;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
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

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User user = super.loadUser(request);

        String provider = request.getClientRegistration().getRegistrationId();
        String email = user.getAttribute("email");
        String username;

        // 1. username 추출
        if ("google".equals(provider)) {
            username = user.getAttribute("name");
            if (username == null || username.isBlank()) {
                username = user.getAttribute("given_name");
            }
            if (username == null || username.isBlank()) {
                username = email != null ? email.split("@")[0] : "googleUser";
            }
        } else {
            username = user.getAttribute("login");
        }

        // 2. fallback 이메일 처리
        if (email == null || email.isEmpty()) {
            email = username + "@" + provider + ".local";
        }

        // 3. 이메일 중복 + provider 불일치 확인
        Optional<User> byEmail = userRepository.findByEmailAndIsDeletedFalse(email);
        if (byEmail.isPresent() && !byEmail.get().getProvider().equals(provider)) {
            log.warn("중복된 이메일 사용 시도: email={}, 기존 provider={}, 시도된 provider={}", email, byEmail.get().getProvider(), provider);
            throw new EmailAlreadyExistsException();
        }

        // 4. provider + email 기준으로 조회
        Optional<User> existingUser = userRepository.findByEmailAndProviderAndIsDeletedFalse(email, provider);
        if (existingUser.isEmpty()) {
            log.info("소셜 회원가입됨: {} ({})", email, provider);
            User newUser = User.builder()
                    .email(email)
                    .username(username)
                    .provider(provider)
                    .password(null)
                    .isVerified(true)
                    .build();
            userRepository.save(newUser);
        }

        // 5. nameAttributeKey 처리
        String nameAttributeKey = user.getAttribute("email") != null ? "email" : "login";

        return new CustomOAuth2User(
                provider,
                new DefaultOAuth2User(
                        Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                        user.getAttributes(),
                        nameAttributeKey
                )
        );
    }
}
