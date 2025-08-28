package com.sandwich.SandWich.auth.security;

import com.sandwich.SandWich.auth.web.RestAccessDeniedHandler;
import com.sandwich.SandWich.oauth.handler.OAuth2FailureHandler;
import com.sandwich.SandWich.oauth.handler.OAuth2SuccessHandler;
import com.sandwich.SandWich.oauth.service.CustomOAuth2UserService;
import com.sandwich.SandWich.oauth.handler.CustomAuthorizationRequestResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@EnableMethodSecurity(prePostEnabled = true)
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    // OAuth2 (구글/깃허브) 연동
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public RestAccessDeniedHandler restAccessDeniedHandler() {
        return new RestAccessDeniedHandler();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, ClientRegistrationRepository repo) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ====== 공용/예외 라우트 ======
                        // meta
                        .requestMatchers("/api/meta/**").permitAll()
                        // 디버그 타임 엔드포인트 (관리자만)
                        .requestMatchers("/api/_debug/**").hasRole("ADMIN")

                        // 좋아요
                        .requestMatchers(HttpMethod.GET, "/api/likes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/likes/users").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/likes").authenticated()

                        // WebSocket/STOMP
                        .requestMatchers("/ws/chat/**").permitAll()
                        .requestMatchers("/topic/**", "/app/**").permitAll()

                        // 프로젝트: 공개 조회 2개만 허용, 나머지는 보호
                        .requestMatchers(HttpMethod.GET, "/api/projects").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/projects/{userId}/{id}").permitAll()
                        .requestMatchers("/api/projects/**").authenticated()

                        // 팔로우/팔로잉/카운트
                        .requestMatchers("/api/users/*/following").permitAll()
                        .requestMatchers("/api/users/*/followers").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/follow-counts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/project-views").hasAnyRole("USER","ADMIN","AI")

                        // build (gitUrl)
                        .requestMatchers(HttpMethod.POST, "/api/build/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/build/**").permitAll()

                        // 공개 메시지 선호도
                        .requestMatchers(HttpMethod.GET, "/api/public/users/*/message-preferences").permitAll()
                        // 내 메시지 선호도 (JWT 필요)
                        .requestMatchers(HttpMethod.GET, "/api/users/me/message-preferences").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/users/message-preferences/me").authenticated()

                        // 이모지
                        .requestMatchers("/api/emojis/**").permitAll()

                        // 다운로드 보호
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/messages/*/attachments").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.GET,  "/api/files/**").authenticated()

                        // 인증/문서/OAuth 콜백 등
                        .requestMatchers(
                                "/api/auth/**", "/api/email/**",
                                "/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**",
                                "/swagger-ui.html", "/webjars/**", "/api/upload/image",
                                // OAuth2 redirect/callback은 반드시 열어둔다
                                "/oauth2/**", "/login/oauth2/**"
                        ).permitAll()

                        // 관리자
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // 나머지는 인증 필요
                        .anyRequest().authenticated()
                )

                // JWT 필터 연결
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                // 예외 처리: 401 / 403
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(customAuthenticationEntryPoint) // 401: 토큰 없음/무효
                        .accessDeniedHandler(restAccessDeniedHandler())           // 403: 권한 부족 → JSON 응답
                )

                // OAuth2 로그인
                .oauth2Login(oauth -> oauth
                        .authorizationEndpoint(endpoint -> endpoint
                                .baseUri("/oauth2/authorization") // ✅ 커스텀 리졸버 제거
                        )
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                );

        return http.build();
    }
}
