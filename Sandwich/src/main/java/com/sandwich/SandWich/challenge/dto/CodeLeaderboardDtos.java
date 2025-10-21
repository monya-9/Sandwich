package com.sandwich.SandWich.challenge.dto;

import lombok.Builder;
import java.util.List;

public class CodeLeaderboardDtos {

    @Builder
    public record Item(
            String user,         // AI 서버 user(=우리 시스템 username과 매핑 시도)
            Integer rank,
            Double score,
            Owner owner          // 우리 시스템 유저 정보(있으면 채움)
    ) {
        @Builder
        public record Owner(
                Long userId,
                String username,   // 우리 시스템의 display name 또는 nickname
                String profileImageUrl
        ) {}
    }

    @Builder
    public record Resp(
            String week,
            List<Item> items,
            boolean found,
            long generatedAt
    ) {}
}
