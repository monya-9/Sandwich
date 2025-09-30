package com.sandwich.SandWich.common.captcha;

import lombok.Getter; import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Getter @Setter
@ConfigurationProperties(prefix = "captcha")
public class RecaptchaProperties {
    private boolean enabled = false;
    private String testBypassToken;

    @Getter @Setter
    public static class V3 {
        private String secret;
        private Double threshold = 0.0;
        private String paths = "";
        public Set<String> pathSet() {
            return Arrays.stream((paths==null?"":paths).split(","))
                    .map(String::trim).filter(s->!s.isBlank()).collect(Collectors.toSet());
        }
    }

    @Getter @Setter
    public static class V2 {
        private String secret;
        private String paths = "";
        public Set<String> pathSet() {
            return Arrays.stream((paths==null?"":paths).split(","))
                    .map(String::trim).filter(s->!s.isBlank()).collect(Collectors.toSet());
        }
    }

    private V3 v3 = new V3();
    private V2 v2 = new V2();
}