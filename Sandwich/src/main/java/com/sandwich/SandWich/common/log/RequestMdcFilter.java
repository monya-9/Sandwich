package com.sandwich.SandWich.common.log;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestMdcFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        try {
            HttpServletRequest req = (HttpServletRequest) request;
            MDC.put("reqId", UUID.randomUUID().toString());
            MDC.put("ip", req.getRemoteAddr());
            MDC.put("ua", String.valueOf(req.getHeader("User-Agent")));
            chain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
