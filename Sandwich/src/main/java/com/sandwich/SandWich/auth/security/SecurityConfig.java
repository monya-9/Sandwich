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
                        // 인증/문서/OAuth 콜백 등
                        // ===== 공개 라우트들 =====
                        .requestMatchers(
                                "/api/auth/**", "/api/email/**",
                                "/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**",
                                "/swagger-ui.html", "/webjars/**", "/api/upload/image",
                                "/oauth2/**", "/login/oauth2/**"
                        ).permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/meta/**").permitAll()
                        .requestMatchers("/api/_debug/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/search/accounts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/likes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/likes/users").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/public/users/*/message-preferences").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/build/**").permitAll()
                        .requestMatchers("/ws/chat/**", "/topic/**", "/app/**").permitAll()
                        .requestMatchers("/api/emojis/**").permitAll()

                        // ===== 댓글 공개 GET =====
                        .requestMatchers(HttpMethod.GET, "/api/comments").permitAll()

                        // ===== 프로젝트 공개 GET을 '인증필요' 규칙보다 위에 선언 (Ant 패턴 사용) =====
                        .requestMatchers(HttpMethod.GET, "/api/projects").permitAll()            // 리스트
                        .requestMatchers(HttpMethod.GET, "/api/projects/*/*").permitAll()        // 상세 (userId/id 스타일)
                        .requestMatchers(HttpMethod.GET, "/api/projects/*/author/**").permitAll()// 작성자 다른 작품(캐러셀)

                        // ===== 챌린지 공개 GET  =====
                        .requestMatchers(HttpMethod.GET, "/api/challenges").permitAll()     // 목록
                        .requestMatchers(HttpMethod.GET, "/api/challenges/**").permitAll()  // 상세(/{id}) 및 확장 대비
                        .requestMatchers(HttpMethod.GET, "/api/challenges/*/votes/summary").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/challenges/*/leaderboard").permitAll()
                        .requestMatchers(HttpMethod.POST, "/internal/ai/**").permitAll()
                        // ===== 사용자 공개 정보 =====
                        .requestMatchers("/api/users/*/following").permitAll()
                        .requestMatchers("/api/users/*/followers").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/follow-counts").permitAll()

                        // ===== 보호 구간 (여기부터 인증 필요) =====
                        .requestMatchers(HttpMethod.GET, "/api/users/*/project-views").hasAnyRole("USER","ADMIN","AI")
                        .requestMatchers(HttpMethod.POST, "/api/likes").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/build/**").authenticated()
                        .requestMatchers(HttpMethod.GET,  "/api/files/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/messages/*/attachments").authenticated()

                        // 챌린지
                        .requestMatchers(HttpMethod.POST, "/api/challenges/*/submissions").authenticated()
                        .requestMatchers(HttpMethod.GET,  "/api/challenges/*/votes/me").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/challenges/*/votes").authenticated()
                        .requestMatchers(HttpMethod.PUT,  "/api/challenges/*/votes/me").authenticated()

                        // 최근 검색어(로그인 전용)
                        .requestMatchers(HttpMethod.GET,    "/api/search/recent").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/search/recent").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/search/recent/**").authenticated()

                        // 이 라인이 '프로젝트 공개 GET'들보다 반드시 아래에 와야 함
                        .requestMatchers("/api/projects/**").authenticated()

                        // 마이 페이지 등
                        .requestMatchers(HttpMethod.GET,  "/api/users/me/message-preferences").authenticated()
                        .requestMatchers(HttpMethod.PUT,  "/api/users/message-preferences/me").authenticated()

                        // 그 외 전부 인증
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
