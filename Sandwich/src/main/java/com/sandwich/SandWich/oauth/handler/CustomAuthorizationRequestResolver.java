package com.sandwich.SandWich.oauth.handler;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.util.HashMap;
import java.util.Map;

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

        Map<String, Object> additional = new HashMap<>(original.getAdditionalParameters());

        Map<String, Object> attrs = new HashMap<>(original.getAttributes());
        attrs.put("provider", provider);

        String remember = request.getParameter("remember");
        if (remember != null && !remember.isBlank()) attrs.put("remember", remember);

        String deviceName = request.getParameter("deviceName");
        if (deviceName != null && !deviceName.isBlank()) attrs.put("deviceName", deviceName);

        return OAuth2AuthorizationRequest.from(original)
                .attributes(attrs)
                .additionalParameters(additional)
                .build();
    }

    private String extractProviderFromURI(String uri) {
        String[] parts = uri.split("/");
        return parts[parts.length - 1];
    }
}
