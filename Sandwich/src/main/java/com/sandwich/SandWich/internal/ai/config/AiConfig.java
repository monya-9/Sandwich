package com.sandwich.SandWich.internal.ai.config;

import com.sandwich.SandWich.internal.ai.AiApiProps;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AiApiProps.class)
public class AiConfig {}