package com.sandwich.SandWich.challenge.dto;

import com.beust.jcommander.internal.Nullable;
import com.sandwich.SandWich.challenge.domain.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

public class SubmissionDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateReq {
        @NotBlank @Size(max = 200)
        private String title;

        @Size(max = 5000)
        private String descr;

        @Pattern(regexp="^https?://.*", message="repoUrl must be http/https")
        @org.springframework.lang.Nullable
        @Size(max = 2048)
        private String repoUrl;

        @Pattern(regexp="^https?://.*", message="demoUrl must be http/https")
        @org.springframework.lang.Nullable
        @Size(max = 2048)
        private String demoUrl;

        @Builder.Default
        @jakarta.validation.Valid
        @Size(max = 10, message = "assets can contain up to 10 items")
        private List<Asset> assets = List.of();

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class Asset {
            @NotBlank @Pattern(regexp="^https?://.*", message="asset.url must be http/https")
            @Size(max = 2048)
            private String url;
            @Size(max = 100)
            private String mime;
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
    public static class Item {
        private Long id;
        private Long ownerId;
        private String title;
        private String repoUrl;
        private String demoUrl;
        private String descr;
        private SubmissionStatus status;
        private String coverUrl;   // 대표 이미지 1장
        private Integer assetCount; // 총 에셋 수

        public static Item from(Submission s) {
            return Item.builder()
                    .id(s.getId())
                    .ownerId(s.getOwnerId())
                    .title(s.getTitle())
                    .repoUrl(s.getRepoUrl())
                    .demoUrl(s.getDemoUrl())
                    .descr(s.getDescr())
                    .status(s.getStatus())
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