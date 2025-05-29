package com.sandwich.SandWich.auth.oauth;
import com.sandwich.SandWich.domain.User;
import com.sandwich.SandWich.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User user = super.loadUser(request);

        String provider = request.getClientRegistration().getRegistrationId(); // e.g., "github"
        String socialId = user.getAttribute("id").toString();
        String email = user.getAttribute("email");
        String username = user.getAttribute("login");

        // 이메일이 없을 경우 임의 이메일 대체
        if (email == null || email.isEmpty()) {
            email = username + "@github.local";
        }

        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isEmpty()) {
            System.out.println("회원가입됨: " + email);
            User newUser = User.builder()
                    .email(email)
                    .username(username)
                    .password(null)
                    .build();
            userRepository.save(newUser);
        }

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                user.getAttributes(),
                "login"
        );
    }
}
