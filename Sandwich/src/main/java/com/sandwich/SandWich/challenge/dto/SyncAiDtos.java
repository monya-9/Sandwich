package com.sandwich.SandWich.challenge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

public class SyncAiDtos {

    @Data
    public static class MonthlyReq {
        @NotBlank private String ym;    // "YYYY-MM"
        private boolean found;
        private MonthlyData data;

        @Data
        public static class MonthlyData {
            @NotBlank private String title;
            private String description;
            private List<String> mustHave;
            private List<String> requirements;
            private List<String> tips;
            private String summary;
        }
    }

    @Data
    public static class WeeklyReq {
        @NotBlank private String week;  // "YYYYWww" e.g. "2025W41"
        private boolean found;
        private WeeklyData data;

        @Data
        public static class WeeklyData {
            @NotBlank private String title;
            private String description;
            private List<String> mustHave;
            private List<String> requirements;
            private List<String> tips;
            private String summary;
        }
    }

    @Data
    public static class SyncResp {
        private Long challengeId;
        private String status;
        private String message;

        public static SyncResp of(Long id, String status, String msg) {
            var r = new SyncResp();
            r.challengeId = id;
            r.status = status;
            r.message = msg;
            return r;
        }
    }
}
