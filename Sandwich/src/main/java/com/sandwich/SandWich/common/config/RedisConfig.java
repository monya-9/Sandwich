package com.sandwich.SandWich.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.*;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.Arrays;

@Configuration
@EnableConfigurationProperties(RedisProps.class)
@RequiredArgsConstructor
public class RedisConfig {

    private final RedisProps props;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        boolean useCluster = props.getClusterNodes() != null && !props.getClusterNodes().isBlank();

        // ✅ useSsl(boolean) 이 아님! 조건문으로 호출해야 함
        LettuceClientConfiguration.LettuceClientConfigurationBuilder b =
                LettuceClientConfiguration.builder()
                        .commandTimeout(Duration.ofSeconds(3))
                        .shutdownTimeout(Duration.ofMillis(100));
        if (Boolean.TRUE.equals(props.getSslEnabled())) {
            b.useSsl();
        }
        LettuceClientConfiguration clientCfg = b.build();

        if (useCluster) {
            RedisClusterConfiguration clusterCfg = new RedisClusterConfiguration(
                    Arrays.stream(props.getClusterNodes().split(","))
                            .map(String::trim)
                            .toList()
            );
            if (props.getUsername() != null && !props.getUsername().isBlank()) {
                clusterCfg.setUsername(props.getUsername());
            }
            if (props.getPassword() != null && !props.getPassword().isBlank()) {
                clusterCfg.setPassword(props.getPassword());
            }
            clusterCfg.setMaxRedirects(5);
            return new LettuceConnectionFactory(clusterCfg, clientCfg);
        } else {
            RedisStandaloneConfiguration std = new RedisStandaloneConfiguration();
            std.setHostName(props.getHost());
            std.setPort(props.getPort() == null ? 6379 : props.getPort());
            if (props.getUsername() != null && !props.getUsername().isBlank()) {
                std.setUsername(props.getUsername());
            }
            if (props.getPassword() != null && !props.getPassword().isBlank()) {
                std.setPassword(props.getPassword());
            }
            return new LettuceConnectionFactory(std, clientCfg);
        }
    }

    @Bean(name = "redisTemplate")
    public RedisTemplate<String, String> redisStringTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, String> t = new RedisTemplate<>();
        t.setConnectionFactory(factory);
        StringRedisSerializer s = new StringRedisSerializer();
        t.setKeySerializer(s);
        t.setValueSerializer(s);
        t.setHashKeySerializer(s);
        t.setHashValueSerializer(s);
        t.afterPropertiesSet();
        return t;
    }

    @Bean(name = "redisJsonTemplate")
    public RedisTemplate<String, Object> redisJsonTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> t = new RedisTemplate<>();
        t.setConnectionFactory(factory);

        ObjectMapper mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        GenericJackson2JsonRedisSerializer json = new GenericJackson2JsonRedisSerializer(mapper);
        StringRedisSerializer str = new StringRedisSerializer();

        t.setKeySerializer(str);
        t.setValueSerializer(json);
        t.setHashKeySerializer(str);
        t.setHashValueSerializer(json);
        t.afterPropertiesSet();
        return t;
    }
}
