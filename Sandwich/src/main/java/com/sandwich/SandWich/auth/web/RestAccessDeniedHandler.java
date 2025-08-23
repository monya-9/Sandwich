package com.sandwich.SandWich.auth.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;

import java.io.IOException;
import java.util.Map;

public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper om = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        om.writeValue(response.getWriter(), Map.of(
                "error", "FORBIDDEN",
                "message", "접근 권한이 없습니다."
        ));
    }
}