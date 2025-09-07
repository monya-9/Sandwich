package com.sandwich.SandWich.reward;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;

@Getter @Setter
@ConfigurationProperties(prefix = "reward.auto-publish")
public class RewardAutoPublishProperties {
    private boolean enabled = true;
    /** "10000,5000,3000" 형태 허용 */
    private String top;
    private Long participant = 0L;
    private int delaySec = 0;
    private boolean dryRun = false;

    public List<Long> topList() {
        if (!StringUtils.hasText(top)) return List.of();
        return Arrays.stream(top.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(Long::valueOf)
                .toList();
    }
}