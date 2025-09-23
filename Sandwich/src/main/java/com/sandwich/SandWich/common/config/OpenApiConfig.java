package com.sandwich.SandWich.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    // 스킴 이름(컨트롤러 @SecurityRequirement에도 동일 문자열 사용)
    public static final String BEARER = "BearerAuth";
    public static final String API_KEY = "ApiKeyAuth";

    @Bean
    public OpenAPI openAPI() {
        // Bearer JWT 스킴
        SecurityScheme bearerScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("JWT Access Token을 입력하세요(앞에 'Bearer ' 붙이지 말고 순수 토큰만).");

        // X-API-KEY 헤더 스킴(선택)
        SecurityScheme apiKeyScheme = new SecurityScheme()
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.HEADER)
                .name("X-API-KEY")
                .description("고정 API 키를 사용하는 엔드포인트용(선택).");

        // 전역으로 Bearer를 기본 적용(원하면 ApiKey도 추가)
        SecurityRequirement globalSec = new SecurityRequirement()
                .addList(BEARER);

        return new OpenAPI()
                .info(new Info()
                        .title("SandWich API")
                        .version("v1"))
                .components(new Components()
                        .addSecuritySchemes(BEARER, bearerScheme)
                        .addSecuritySchemes(API_KEY, apiKeyScheme))
                .addSecurityItem(globalSec);
    }
}