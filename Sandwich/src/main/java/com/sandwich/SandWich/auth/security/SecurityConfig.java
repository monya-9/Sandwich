package com.sandwich.SandWich.auth.security;
import com.sandwich.SandWich.oauth.service.CustomOAuth2UserService;
import com.sandwich.SandWich.oauth.handler.OAuth2FailureHandler;
import com.sandwich.SandWich.oauth.handler.OAuth2SuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.sandwich.SandWich.oauth.handler.CustomAuthorizationRequestResolver;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;


@EnableMethodSecurity(prePostEnabled = true)
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, ClientRegistrationRepository repo) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 인증 없이 허용할 GET 요청 (조회용)
                        .requestMatchers(
                                "/api/projects",                // GET 전체 조회
                                "/api/projects/{id:[0-9]+}"     // GET 상세 조회
                        ).permitAll()

                        // 그 외 모든 프로젝트 API (등록, 수정, 삭제 등)는 인증 필요
                        .requestMatchers("/api/projects/**").authenticated()
                        // 나머지 인증 예외 경로
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/email/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-resources/**",
                                "/swagger-ui.html",
                                "/webjars/**",
                                "/api/upload/image"
                        ).permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            log.warn("인증 실패: {}", authException.getMessage());
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            var auth = SecurityContextHolder.getContext().getAuthentication();
                            log.warn("403 접근 거부됨: 인증 객체 = {}", auth);
                            response.sendError(HttpServletResponse.SC_FORBIDDEN);
                        })
                )
                .oauth2Login(oauth -> oauth
                        .authorizationEndpoint(endpoint -> endpoint
                                .authorizationRequestResolver(
                                        new CustomAuthorizationRequestResolver(repo, "/oauth2/authorization")
                                )
                        )
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                );

        return http.build();
    }
}
