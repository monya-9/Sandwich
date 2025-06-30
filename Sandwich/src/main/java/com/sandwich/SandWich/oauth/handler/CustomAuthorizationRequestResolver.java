package com.sandwich.SandWich.oauth.handler;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * OAuth2 로그인 시 요청에 provider 파라미터를 추가해서
 * 실패 핸들러에서 사용할 수 있게 만들어줌
 */
@RequiredArgsConstructor
public class CustomAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;

    public CustomAuthorizationRequestResolver(ClientRegistrationRepository repo, String baseUri) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(repo, baseUri);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest base = defaultResolver.resolve(request);
        return customize(request, base);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest base = defaultResolver.resolve(request, clientRegistrationId);
        return customize(request, base);
    }

    private OAuth2AuthorizationRequest customize(HttpServletRequest request, OAuth2AuthorizationRequest original) {
        if (original == null) return null;

        String provider = extractProviderFromURI(request.getRequestURI());

        Map<String, Object> additionalParams = new HashMap<>(original.getAdditionalParameters());
        additionalParams.put("provider", provider);
        return OAuth2AuthorizationRequest.from(original)
                .additionalParameters(additionalParams)
                .state(provider)
                .build();
    }

    private String extractProviderFromURI(String uri) {
        // 예: /oauth2/authorization/github → github
        String[] parts = uri.split("/");
        return parts[parts.length - 1];
    }
}