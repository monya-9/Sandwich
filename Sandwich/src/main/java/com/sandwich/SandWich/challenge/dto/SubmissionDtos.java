package com.sandwich.SandWich.challenge.dto;

import com.beust.jcommander.internal.Nullable;
import com.sandwich.SandWich.challenge.domain.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

public class SubmissionDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateReq {
        @NotBlank private String title;
        private String descr;
        @Pattern(regexp="^https?://.*", message="repoUrl must be http/https") @Nullable
        private String repoUrl;
        @Pattern(regexp="^https?://.*", message="demoUrl must be http/https") @Nullable
        private String demoUrl;
        @Builder.Default
        private List<Asset> assets = List.of();

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class Asset {
            @NotBlank private String url;
            private String mime;
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Item {
        private Long id;
        private Long ownerId;
        private String title;
        private String repoUrl;
        private String demoUrl;
        private SubmissionStatus status;

        public static Item from(Submission s) {
            return Item.builder()
                    .id(s.getId())
                    .ownerId(s.getOwnerId())
                    .title(s.getTitle())
                    .repoUrl(s.getRepoUrl())
                    .demoUrl(s.getDemoUrl())
                    .status(s.getStatus())
                    .build();
        }
    }
}