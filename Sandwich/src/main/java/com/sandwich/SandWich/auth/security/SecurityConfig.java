package com.sandwich.SandWich.auth.security;

import com.sandwich.SandWich.auth.web.RestAccessDeniedHandler;
import com.sandwich.SandWich.oauth.handler.OAuth2FailureHandler;
import com.sandwich.SandWich.oauth.handler.OAuth2SuccessHandler;
import com.sandwich.SandWich.oauth.service.CustomOAuth2UserService;
import com.sandwich.SandWich.auth.device.DeviceTrustService;
import com.sandwich.SandWich.auth.security.TrustedDeviceFilter;
import com.sandwich.SandWich.oauth.handler.CustomAuthorizationRequestResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.core.annotation.Order;
import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@EnableMethodSecurity(prePostEnabled = true)
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final DeviceTrustService deviceTrustService;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;
    private final ServiceTokenFilter serviceTokenFilter;

    // OAuth2 (구글/깃허브) 연동
    private final ObjectProvider<ClientRegistrationRepository> repoProvider;
    private final ObjectProvider<CustomOAuth2UserService> customOAuth2UserServiceProvider;
    private final ObjectProvider<OAuth2SuccessHandler> oAuth2SuccessHandlerProvider;
    private final ObjectProvider<OAuth2FailureHandler> oAuth2FailureHandlerProvider;

    @Bean
    @Order(0)
    public SecurityFilterChain actuatorChain(HttpSecurity http) throws Exception {
        return http
                .securityMatcher(request -> request.getServerPort() == 9090) // 관리 포트 한정
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health/**","/actuator/prometheus").permitAll()
                        .anyRequest().denyAll() // 그 외 액추에이터는 차단
                )
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public RestAccessDeniedHandler restAccessDeniedHandler() {
        return new RestAccessDeniedHandler();
    }

    // CORS 설정 Bean
    @Value("${management.endpoints.web.cors.allowed-origins}")
    private String allowedOriginsCsv;

    @Value("${management.endpoints.web.cors.allowed-methods}")
    private String allowedMethodsCsv;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOriginsCsv.split(","))
                .map(String::trim)
                .toList();

        List<String> methods = Arrays.stream(allowedMethodsCsv.split(","))
                .map(String::trim)
                .toList();

        // setAllowedOriginPatterns()를 사용하여 와일드카드 패턴 지원
        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(methods);
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                .requestMatchers(HttpMethod.GET, "/health");
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, ObjectProvider<ClientRegistrationRepository> repoProvider) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/internal/**")  // 내부 API는 CSRF 미적용
                        .disable()
                )

                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers("/error", "/error/**").permitAll()
                        // === Device management ===
                        .requestMatchers(org.springframework.http.HttpMethod.GET,  "/api/auth/devices").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE,"/api/auth/devices/*").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.POST,  "/api/auth/devices/revoke-all").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.POST,  "/api/auth/devices/revoke-current").authenticated()
                        .requestMatchers("/api/admin/devices/**").hasRole("ADMIN")
                        // ===== 공개 라우트들 =====
                        .requestMatchers(
                                "/api/auth/login", "/api/auth/signup",
                                "/api/auth/refresh", "/api/auth/otp/**",
                                "/api/email/**",
                                "/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**",
                                "/swagger-ui.html", "/webjars/**",
                                "/oauth2/**", "/login/oauth2/**"
                        ).permitAll()
                        // 하네스/정적 html 허용
                        .requestMatchers(
                                "/", "/recaptcha-v2.html", "/recaptcha-v3.html", "/favicon.ico"
                        ).permitAll()
                        // OTP 경로 허용
                        .requestMatchers("/api/auth/otp/**").permitAll()
                        // 필요시 정적 폴더 패턴도 추가
                        .requestMatchers("/css/**", "/js/**", "/img/**", "/assets/**", "/webjars/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/check-email").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/meta/**").permitAll()
                        .requestMatchers("/api/_debug/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/search/accounts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/likes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/likes/users").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/public/users/*/message-preferences").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/build/**").permitAll()
                        .requestMatchers("/ws/chat/**", "/topic/**", "/app/**").permitAll()
                        .requestMatchers("/api/emojis/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/discovery/hot-developers").permitAll()

                        // ===== 댓글 공개 GET =====
                        .requestMatchers(HttpMethod.GET, "/api/comments/**").permitAll()
                        // ===== 프로젝트 공개 GET을 '인증필요' 규칙보다 위에 선언 (Ant 패턴 사용) =====
                        .requestMatchers(HttpMethod.GET, "/api/projects").permitAll()            // 리스트
                        .requestMatchers(HttpMethod.GET, "/api/projects/*/*").permitAll()        // 상세 (userId/id 스타일)
                        .requestMatchers(HttpMethod.GET, "/api/projects/*/*/contents").permitAll() // 상세 콘텐츠 목록
                        .requestMatchers(HttpMethod.GET, "/api/projects/*/author/**").permitAll()// 작성자 다른 작품(캐러셀)

                        // ===== 챌린지 공개 GET  =====
                        .requestMatchers(HttpMethod.GET, "/api/challenges").permitAll()     // 목록
                        .requestMatchers(HttpMethod.GET, "/api/challenges/**").permitAll()  // 상세(/{id}) 및 확장 대비
                        .requestMatchers(HttpMethod.GET, "/api/challenges/*/votes/summary").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/challenges/*/leaderboard").permitAll()
                        .requestMatchers(HttpMethod.POST, "/internal/discovery/hot-developers/**").hasRole("ADMIN")
                        // .requestMatchers(HttpMethod.POST, "/internal/ai/**").permitAll()
                        .requestMatchers("/internal/**").hasAuthority("SCOPE_CHALLENGE_BATCH_WRITE")
                        // ===== 사용자 공개 정보 =====
                        .requestMatchers("/api/users/*/following").permitAll()
                        .requestMatchers("/api/users/*/followers").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/follow-counts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/representative-careers").permitAll()

                        // slug 기반 공개 프로필
                        .requestMatchers(HttpMethod.GET, "/api/users/slug/**").permitAll()
                        // 사용자 보안 세분화 =====
                        // 1) 내 프로필은 반드시 인증
                        .requestMatchers(HttpMethod.GET, "/api/users/me").authenticated()
                        // 2) 개별 보호 엔드포인트는 계속 잠금 (GET이라도 잠금 유지)
                        .requestMatchers(HttpMethod.GET, "/api/users/position").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/interests/**").authenticated()
                        // 닉네임 중복 확인은 회원가입 단계에서 쓸 수 있게 공개해두는 게 일반적
                        .requestMatchers(HttpMethod.GET, "/api/users/check-nickname").permitAll()
                        // 3) 타인 공개 프로필: /api/users/{id} 만 열기
                        //    Ant의 "/api/users/*"는 한 세그먼트만 매칭 → {id}에만 해당.
                        //    위에서 /me/position/interests/** 를 먼저 선언해 잠가두었기 때문에 이 줄이 그들을 열어버리지 않음.
                        .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()

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
                        .requestMatchers("/internal/**").authenticated()

                        // 최근 검색어(로그인 전용)
                        .requestMatchers(HttpMethod.GET,    "/api/search/recent").authenticated()
                        .requestMatchers(HttpMethod.POST,   "/api/search/recent").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/search/recent/**").authenticated()

                        .requestMatchers(HttpMethod.GET, "/api/reco/**").permitAll()
                        // 이 라인이 '프로젝트 공개 GET'들보다 반드시 아래에 와야 함
                        .requestMatchers("/api/projects/**").authenticated()

                        // 마이 페이지 등
                        .requestMatchers(HttpMethod.GET,  "/api/users/me/message-preferences").authenticated()
                        .requestMatchers(HttpMethod.PUT,  "/api/users/message-preferences/me").authenticated()

                        // 마이페이지 계열
                        .requestMatchers("/api/me/**").authenticated()

                        // 그 외 전부 인증
                        .anyRequest().authenticated()
                )

                .addFilterBefore(serviceTokenFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new TrustedDeviceFilter(deviceTrustService), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                // 예외 처리: 401 / 403
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(customAuthenticationEntryPoint) // 401: 토큰 없음/무효
                        .accessDeniedHandler(restAccessDeniedHandler())           // 403: 권한 부족 → JSON 응답
                );

        // OAuth2는 등록 정보가 있을 때만 활성화
        ClientRegistrationRepository repo = repoProvider.getIfAvailable();
        var userService = customOAuth2UserServiceProvider.getIfAvailable();
        var successHandler = oAuth2SuccessHandlerProvider.getIfAvailable();
        var failureHandler = oAuth2FailureHandlerProvider.getIfAvailable();

        if (repo != null && userService != null && successHandler != null && failureHandler != null) {
            http.oauth2Login(oauth -> oauth
                    .authorizationEndpoint(a -> a.authorizationRequestResolver(
                            new CustomAuthorizationRequestResolver(repo, "/oauth2/authorization")
                    ))
                    .userInfoEndpoint(u -> u.userService(userService))
                    .successHandler(successHandler)
                    .failureHandler(failureHandler)
            );
        }

        return http.build();
    }
}
