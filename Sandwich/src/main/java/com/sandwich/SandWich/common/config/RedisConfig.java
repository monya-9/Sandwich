package com.sandwich.SandWich.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.*;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {
    @Bean(name = "redisTemplate")
    public RedisTemplate<String, String> redisStringTemplate(RedisConnectionFactory factory) {
        var t = new RedisTemplate<String, String>();
        t.setConnectionFactory(factory);
        var str = new StringRedisSerializer();
        t.setKeySerializer(str);
        t.setValueSerializer(str);
        t.setHashKeySerializer(str);
        t.setHashValueSerializer(str);
        t.afterPropertiesSet();
        return t;
    }

    // 리더보드 캐시용 — JSON 직렬화 템플릿
    @Bean(name = "redisJsonTemplate")
    public RedisTemplate<String, Object> redisJsonTemplate(RedisConnectionFactory factory) {
        var t = new RedisTemplate<String, Object>();
        t.setConnectionFactory(factory);

        // 전용 ObjectMapper 생성 (전역 Bean 건드리지 않음)
        ObjectMapper mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // 생성자에 mapper 주입: setObjectMapper(...) 불필요
        var json = new GenericJackson2JsonRedisSerializer(mapper);

        var str = new StringRedisSerializer();
        t.setKeySerializer(str);
        t.setValueSerializer(json);
        t.setHashKeySerializer(str);
        t.setHashValueSerializer(json);

        t.afterPropertiesSet();
        return t;
    }
}
