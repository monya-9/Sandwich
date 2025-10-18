package com.sandwich.SandWich.auth.mfa;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(MfaProperties.class)
public class MfaConfig {
}