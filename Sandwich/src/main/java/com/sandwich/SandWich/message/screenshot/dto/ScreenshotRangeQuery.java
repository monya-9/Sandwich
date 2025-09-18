package com.sandwich.SandWich.message.screenshot.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScreenshotRangeQuery {

    @NotNull private Long fromId;            // 뷰포트 상단 메시지 ID
    @NotNull private Long toId;              // 뷰포트 하단 메시지 ID

    // 렌더 옵션 (네 렌더러 시그니처에 맞춤)
    private String theme;                    // "light" | "dark" (기본: light)
    @Min(320) private Integer width;         // 픽셀, 기본 900
    @Min(1)   private Integer scale;         // PNG 배율, 기본 1 (1..3 권장)

    public String themeOrDefault() { return (theme == null || theme.isBlank()) ? "light" : theme; }
    public int widthOrDefault() { return (width == null || width < 320) ? 900 : width; }
    public int scaleOrDefault() {
        if (scale == null || scale < 1) return 1;
        return Math.min(scale, 3);
    }
}