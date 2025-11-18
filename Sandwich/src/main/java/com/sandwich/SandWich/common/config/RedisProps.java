package com.sandwich.SandWich.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter @Setter
@ConfigurationProperties(prefix = "spring.data.redis")
public class RedisProps {
    /** Standalone */
    private String host;
    private Integer port = 6379;

    /** 공통 */
    private Boolean sslEnabled = false;
    private String username;
    private String password;

    /** Cluster */
    // "host1:6379,host2:6379" 또는 null/빈문자
    private String clusterNodes;
}
