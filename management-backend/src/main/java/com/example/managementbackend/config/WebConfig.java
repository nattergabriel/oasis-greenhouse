package com.example.managementbackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final AgentTokenInterceptor agentTokenInterceptor;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false)
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Agent-write endpoints require X-Agent-Token
        registry.addInterceptor(agentTokenInterceptor)
                .addPathPatterns(
                        "/api/agent/log",           // POST
                        "/api/agent/log/**",         // PATCH /{id}
                        "/api/agent/recommendations", // POST
                        "/api/alerts",               // POST
                        "/api/crops/planting-queue",  // POST
                        "/api/bridge/**"             // POST import-result
                );
    }
}
