package com.sandwich.SandWich.internal.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

public class BatchDtos {

    @Data
    public static class BatchReq {
        @NotBlank private String month; // "2025-11"
        @NotNull  private List<Item> items;

        @Data
        public static class Item {
            @NotBlank private String title;
            @NotBlank private String type;     // "PORTFOLIO" | "CODE" 등
            @NotBlank private String startAt;  // ISO8601
            @NotBlank private String endAt;    // ISO8601
            private String summary;
            private List<String> must;
            private String md;
        }
    }
}
