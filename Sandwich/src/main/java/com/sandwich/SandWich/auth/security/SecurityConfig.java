package com.sandwich.SandWich.auth.security;

import com.sandwich.SandWich.auth.web.RestAccessDeniedHandler;
import com.sandwich.SandWich.oauth.handler.OAuth2FailureHandler;
import com.sandwich.SandWich.oauth.handler.OAuth2SuccessHandler;
import com.sandwich.SandWich.oauth.service.CustomOAuth2UserService;
import com.sandwich.SandWich.oauth.handler.CustomAuthorizationRequestResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.List;
import org.springframework.security.config.Customizer;
import org.springframework.http.HttpMethod;

@EnableMethodSecurity(prePostEnabled = true)
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    // OAuth2 (구글/깃허브) 연동
    private final ObjectProvider<ClientRegistrationRepository> repoProvider;
    private final ObjectProvider<CustomOAuth2UserService> customOAuth2UserServiceProvider;
    private final ObjectProvider<OAuth2SuccessHandler> oAuth2SuccessHandlerProvider;
    private final ObjectProvider<OAuth2FailureHandler> oAuth2FailureHandlerProvider;

    // [CORS 설정 빈 추가]
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 프론트엔드의 CloudFront 도메인과 로컬 개발 주소를 명시적으로 허용
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "https://d31vlhzf7p5sqr.cloudfront.net",
                "https://sd-LB-1117689927.ap-northeast-2.elb.amazonaws.com" // 임시 허용
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*")); // 모든 헤더 허용
        // Authorization 헤더(JWT)를 브라우저가 전송하도록 허용
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // 모든 경로에 대해 적용
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public RestAccessDeniedHandler restAccessDeniedHandler() {
        return new RestAccessDeniedHandler();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, ObjectProvider<ClientRegistrationRepository> repoProvider) throws Exception {
        http
                // CORS 빈을 사용하도록 활성화
                .cors(Customizer.withDefaults())

                .csrf(csrf -> csrf.disable())
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ==== 배포 ====
                        // 로드밸런싱 용 HealthCheck
                        .requestMatchers(HttpMethod.GET, "/health").permitAll()

                        // 브라우저의 preflight(OPTIONS)를 우선 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // ==== 배포 End ====

                        .requestMatchers("/error", "/error/**").permitAll()
                        // 인증/문서/OAuth 콜백 등
                        // ===== 공개 라우트들 =====
                        .requestMatchers(
                                "/api/auth/**", "/api/email/**",
                                "/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**",
                                "/swagger-ui.html", "/webjars/**", "/api/upload/image",
                                "/oauth2/**", "/login/oauth2/**"
                        ).permitAll()
                        // 하네스/정적 html 허용
                        .requestMatchers(
                                "/", "/recaptcha-v2.html", "/recaptcha-v3.html", "/favicon.ico"
                        ).permitAll()
                        // 필요시 정적 폴더 패턴도 추가
                        .requestMatchers("/css/**", "/js/**", "/img/**", "/assets/**", "/webjars/**").permitAll()

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
                        .requestMatchers(HttpMethod.GET, "/api/projects/*/*/contents").permitAll() // 상세 콘텐츠 목록
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
                );

        // OAuth2는 등록 정보가 있을 때만 활성화
        ClientRegistrationRepository repo = repoProvider.getIfAvailable();
        var userService = customOAuth2UserServiceProvider.getIfAvailable();
        var successHandler = oAuth2SuccessHandlerProvider.getIfAvailable();
        var failureHandler = oAuth2FailureHandlerProvider.getIfAvailable();

        if (repo != null && userService != null && successHandler != null && failureHandler != null) {
            http
                    .oauth2Login(oauth -> oauth
                            .userInfoEndpoint(u -> u.userService(userService))
                            .successHandler(successHandler)
                            .failureHandler(failureHandler)
                    );
        }

        return http.build();
    }
}
