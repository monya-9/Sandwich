package com.sandwich.SandWich.challenge.dto;

import jakarta.validation.Valid;
import com.sandwich.SandWich.challenge.domain.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;
import org.springframework.lang.Nullable;

public class SubmissionDtos {


    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateReq {
        @Nullable @Size(max = 200)
        private String title;

        @Valid @Nullable
        private CreateReq.PortfolioMeta portfolio;

        @Nullable @Size(max = 5000)
        private String desc;

        @Pattern(regexp="^https?://.*", message="repoUrl must be http/https")
        @Nullable @Size(max = 2048)
        private String repoUrl;

        @Pattern(regexp="^https?://.*", message="demoUrl must be http/https")
        @Nullable @Size(max = 2048)
        private String demoUrl;

        @Pattern(regexp="^https?://.*", message="coverUrl must be http/https")
        @Nullable @Size(max = 2048)
        private String coverUrl;

        @Nullable
        private com.sandwich.SandWich.challenge.domain.Submission.ParticipationType participationType;

        @Nullable @Size(max=200)
        private String teamName;

        @Nullable @Size(max=5000)
        private String membersText;

        @Valid
        @Size(max = 10, message = "assets can contain up to 10 items")
        @Nullable
        private List<CreateReq.Asset> assets;

        @Valid
        @Nullable
        private CreateReq.Code code;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateReq {
        @NotBlank @Size(max = 200)
        private String title;

        @Size(max = 5000)
        private String desc;

        @Pattern(regexp="^https?://.*", message="repoUrl must be http/https")
        @org.springframework.lang.Nullable
        @Size(max = 2048)
        private String repoUrl;

        @Pattern(regexp="^https?://.*", message="demoUrl must be http/https")
        @org.springframework.lang.Nullable
        @Size(max = 2048)
        private String demoUrl;

        @Pattern(regexp="^https?://.*", message="coverUrl must be http/https")
        @Nullable @Size(max=2048)
        private String coverUrl;


        @Nullable
        private Submission.ParticipationType participationType;

        @Nullable @Size(max=200)
        private String teamName;

        @Nullable @Size(max=5000)
        private String membersText;

        @Builder.Default
        @jakarta.validation.Valid
        @Size(max = 10, message = "assets can contain up to 10 items")
        private List<Asset> assets = List.of();

        // --- 코드 챌린지용 추가 ---
        @Valid
        private Code code;
        private Long viewCount;
        private Long likeCount;
        private Long commentCount;
        private java.time.OffsetDateTime createdAt;
        private Item.Owner owner;
        private String language;
        private Double totalScore;

        @Valid @Nullable
        private PortfolioMeta portfolio;

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class PortfolioMeta {
            private String language;
            private java.util.List<String> tech;
        }


        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class Asset {
            @NotBlank @Pattern(regexp="^https?://.*", message="asset.url must be http/https")
            @Size(max = 2048)
            private String url;
            @Size(max = 100)
            private String mime;
        }

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class Code {
            @NotBlank @Size(max=30)
            private String language;   // 예: "java","python","node","go","rust","cpp","ts","js"
            @NotBlank @Size(max=120)
            @Pattern(regexp = "^[\\w./:-]+$", message = "entrypoint has invalid characters")
            private String entrypoint; // 예: "src/main.py", "app/Main.java", "npm:start"
            @Nullable
            @Pattern(regexp = "^[0-9a-fA-F]{7,64}$", message = "commitSha must be hex (7-64)")
            private String commitSha;  // optional
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
    public static class Item {
        private Long id;
        private Long ownerId;
        private String title;
        private String repoUrl;
        private String demoUrl;
        private String desc;
        private SubmissionStatus status;
        private String coverUrl;   // 대표 이미지 1장
        private Integer assetCount; // 총 에셋 수
        private Long viewCount;
        private Long likeCount;
        private Long commentCount;
        private java.time.OffsetDateTime createdAt;
        private Owner owner;
        private String language;
        private Double totalScore;
        private CodeInfo code;   // ← 코드 챌린지용 상세 정보
        private PortfolioInfo portfolio; // ← 포트폴리오 메타

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class CodeInfo {
            private String language;
            private String entrypoint;
            private String commitSha; // optional
        }

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class PortfolioInfo {
            private String language;            // 예: "TypeScript"
            private java.util.List<String> tech; // 예: ["Next.js","Spring Boot"]
        }

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class Owner {
            private Long userId;
            private String username;
            private String profileImageUrl;
            private String position;
        }


        public static Item from(Submission s) {
            return Item.builder()
                    .id(s.getId())
                    .ownerId(s.getOwnerId())
                    .title(s.getTitle())
                    .repoUrl(s.getRepoUrl())
                    .demoUrl(s.getDemoUrl())
                    .desc(s.getDesc())
                    .status(s.getStatus())
                    .createdAt(s.getCreatedAt())
                    .coverUrl(s.getCoverUrl())
                    .build();
        }

        public static Item fromWithStats(Submission s, String coverUrl, int assetCount) {
            return from(s).toBuilder()
                    .coverUrl(coverUrl)
                    .assetCount(assetCount)
                    .build();
        }

    }
}