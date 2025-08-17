package com.sandwich.SandWich.auth.security;

import com.sandwich.SandWich.oauth.handler.OAuth2FailureHandler;
import com.sandwich.SandWich.oauth.handler.OAuth2SuccessHandler;
import com.sandwich.SandWich.oauth.service.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@EnableMethodSecurity(prePostEnabled = true)
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // --- 좋아요 ---
                        .requestMatchers(HttpMethod.GET, "/api/likes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/likes/users").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/likes").authenticated()

                        // --- 프로젝트 조회 ---
                        .requestMatchers(HttpMethod.GET, "/api/projects").permitAll()
                        // Ant 매처는 {var} 지원X → 세그먼트 와일드카드로 허용
                        .requestMatchers(HttpMethod.GET, "/api/projects/*/*").permitAll()

                        // --- 팔로우/팔로잉/카운트 ---
                        .requestMatchers("/api/users/*/following").permitAll()
                        .requestMatchers("/api/users/*/followers").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/follow-counts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/project-views").hasAnyRole("USER","ADMIN","AI")

                        // --- 빌드(gitUrl 등) ---
                        .requestMatchers(HttpMethod.POST, "/api/build/**").authenticated()
                        .requestMatchers(HttpMethod.GET,  "/api/build/**").permitAll()

                        // ===== develop에서 추가된 공개/인증 경로 병합 =====
                        // 공개 메시지 선호도 조회
                        .requestMatchers(HttpMethod.GET, "/api/public/users/*/message-preferences").permitAll()
                        // 내 메시지 선호도 조회/수정 (JWT 필요)
                        .requestMatchers(HttpMethod.GET, "/api/users/me/message-preferences").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/users/message-preferences/me").authenticated()
                        // 이모지 API
                        .requestMatchers("/api/emojis/**").permitAll()
                        // =================================================

                        // --- 인증 예외(공용) ---
                        .requestMatchers(
                                "/api/auth/**", "/api/email/**",
                                "/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**",
                                "/swagger-ui.html", "/webjars/**", "/api/upload/image",
                                "/oauth2/**", "/login/oauth2/**"
                        ).permitAll()

                        // 관리자
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // 기타는 인증 필요
                        .anyRequest().authenticated()
                )

                // JWT 필터
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                // 로그아웃
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            log.info("✅ 로그아웃 완료: {}", authentication != null ? authentication.getName() : "익명");
                            response.setStatus(HttpServletResponse.SC_OK);
                        })
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                )

                // 예외 처리
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(customAuthenticationEntryPoint)
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            var auth = SecurityContextHolder.getContext().getAuthentication();
                            log.warn("403 접근 거부됨: 인증 객체 = {}", auth);
                            response.sendError(HttpServletResponse.SC_FORBIDDEN);
                        })
                )

                // OAuth2 로그인
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                );

        return http.build();
    }
}
