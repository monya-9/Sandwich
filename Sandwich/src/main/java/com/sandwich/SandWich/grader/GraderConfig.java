package com.sandwich.SandWich.grader;

import lombok.RequiredArgsConstructor;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.Timeout;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties(GraderProperties.class)
@RequiredArgsConstructor
public class GraderConfig {

    private final GraderProperties props;

    @Bean
    public RestTemplate graderRestTemplate() {
        PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
        cm.setMaxTotal(100);
        cm.setDefaultMaxPerRoute(20);

        RequestConfig rc = RequestConfig.custom()
                .setConnectTimeout(Timeout.ofMilliseconds(props.getConnectTimeoutMs()))
                .setConnectionRequestTimeout(Timeout.ofMilliseconds(props.getConnectTimeoutMs()))
                .setResponseTimeout(Timeout.ofMilliseconds(props.getReadTimeoutMs()))
                .build();

        CloseableHttpClient client = HttpClients.custom()
                .setConnectionManager(cm)
                .setDefaultRequestConfig(rc)
                .evictExpiredConnections()
                .build();

        return new RestTemplate(new HttpComponentsClientHttpRequestFactory(client));
    }
}
