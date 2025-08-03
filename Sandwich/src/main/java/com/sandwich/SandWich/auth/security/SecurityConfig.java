package com.sandwich.SandWich.auth.security;

import com.sandwich.SandWich.oauth.service.CustomOAuth2UserService;
import com.sandwich.SandWich.oauth.handler.OAuth2FailureHandler;
import com.sandwich.SandWich.oauth.handler.OAuth2SuccessHandler;
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
                        // 좋아요
                        .requestMatchers(HttpMethod.GET, "/api/likes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/likes/users").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/likes").authenticated()

                        // 프로젝트 조회
                        .requestMatchers(HttpMethod.GET, "/api/projects").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/projects/{userId}/{id}").permitAll()

                        // 팔로우/팔로잉 조회
                        .requestMatchers("/api/users/*/following").permitAll()
                        .requestMatchers("/api/users/*/followers").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/follow-counts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/project-views").hasAnyRole("USER","ADMIN","AI")

                        // gitUrl
                        .requestMatchers(HttpMethod.POST, "/api/build/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/build/**").permitAll()

                        // 인증 예외 경로
                        .requestMatchers(
                                "/api/auth/**", "/api/email/**",
                                "/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**",
                                "/swagger-ui.html", "/webjars/**", "/api/upload/image",
                                "/oauth2/**", "/login/oauth2/**"
                        ).permitAll()

                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )

                // JWT 필터
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                // 예외 처리
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(customAuthenticationEntryPoint)
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            var auth = SecurityContextHolder.getContext().getAuthentication();
                            log.warn("403 접근 거부됨: 인증 객체 = {}", auth);
                            response.sendError(HttpServletResponse.SC_FORBIDDEN);
                        })
                )

                // 표준 OAuth2 로그인
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                );

        return http.build();
    }
}
