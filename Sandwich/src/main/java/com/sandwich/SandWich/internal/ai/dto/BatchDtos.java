package com.sandwich.SandWich.internal.ai.dto;

import com.sandwich.SandWich.challenge.domain.ChallengeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

public class BatchDtos {

    @Data
    public static class BatchReq {
        @NotBlank
        private String month;            // YYYY-MM

        @NotEmpty
        private List<Item> items;

        @Data
        public static class Item {
            @NotBlank
            private String title;

            @NotNull
            private ChallengeType type;  // PORTFOLIO | CODE

            // 콘텐츠
            private String summary;      // null 가능 → 서버에서 null-safe로 처리
            private List<String> must;
            private String md;

            // CODE용(필수), PORTFOLIO용(무시)
            private String startAt;      // ISO8601 (예: 2025-10-06T00:00:00+09:00)
            private String endAt;        // ISO8601
        }
    }
}
