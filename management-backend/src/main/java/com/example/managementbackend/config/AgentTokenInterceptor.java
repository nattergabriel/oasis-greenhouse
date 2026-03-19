package com.example.managementbackend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AgentTokenInterceptor implements HandlerInterceptor {

    @Value("${agent.token:}")
    private String expectedToken;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Only enforce agent token on write methods — frontend reads are unauthenticated
        if ("GET".equalsIgnoreCase(request.getMethod()) || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String token = request.getHeader("X-Agent-Token");
        if (token == null || token.isBlank() || (!expectedToken.isBlank() && !expectedToken.equals(token))) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\":401,\"error\":\"Missing or invalid X-Agent-Token\"}");
            return false;
        }
        return true;
    }
}
