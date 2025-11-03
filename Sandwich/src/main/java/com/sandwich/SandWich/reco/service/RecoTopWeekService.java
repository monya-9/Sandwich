package com.sandwich.SandWich.reco.service;

import com.sandwich.SandWich.internal.ai.AiRecoClient;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.dto.ProjectListItemResponse;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecoTopWeekService {

    private final AiRecoClient ai;
    private final ProjectRepository projects;

    // 최종 응답(프론트 요구 스펙)
    public record Response(String week, Integer total, List<Item> content) {}

    // content 항목: 기존 ProjectListItemResponse 형태를 복사하되 email만 제외
    public static final class Item {
        public final Long id;
        public final String title;
        public final String description;
        public final String coverUrl;
        public final Boolean isTeam;
        public final String username;
        public final String shareUrl;
        public final String qrImageUrl;
        public final Owner owner; // email 제외

        public Item(Long id, String title, String description, String coverUrl, Boolean isTeam,
                    String username, String shareUrl, String qrImageUrl, Owner owner) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.coverUrl = coverUrl;
            this.isTeam = isTeam;
            this.username = username;
            this.shareUrl = shareUrl;
            this.qrImageUrl = qrImageUrl;
            this.owner = owner;
        }

        public static final class Owner {
            public final Long id;
            public final String nickname;
            public final String avatarUrl;
            public final String username;
            public Owner(Long id, String nickname, String avatarUrl, String username) {
                this.id = id;
                this.nickname = nickname;
                this.avatarUrl = avatarUrl;
                this.username = username;
            }
        }
    }

    @Transactional(readOnly = true)
    public Response get() {
        var aiResp = ai.getTopWeekRanking();
        if (aiResp == null || aiResp.data() == null || aiResp.data().isEmpty()) {
            return new Response(aiResp != null ? aiResp.week() : null, aiResp != null ? aiResp.total() : 0, List.of());
        }

        Map<Long, Double> scoreMap = aiResp.data().stream()
                .filter(it -> it.projectId() != null)
                .collect(Collectors.toMap(AiRecoClient.TopWeekResp.Item::projectId, AiRecoClient.TopWeekResp.Item::score, (a,b)->a));

        var ids = new ArrayList<>(scoreMap.keySet());
        // 필요시 fetch-join 메서드로 교체
        List<Project> rows = projects.findAllById(ids);

        rows.sort(Comparator
                .<Project>comparingDouble(p -> -scoreMap.getOrDefault(p.getId(), 0.0))
                .thenComparing(Project::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));

        List<Item> content = rows.stream()
                .map(this::toPublicItem)
                .toList();

        return new Response(aiResp.week(), aiResp.total(), content);
    }

    /** Project → email 없는 public item */
    private Item toPublicItem(Project p) {
        // 기존 DTO로 한 번 매핑(탈퇴 사용자 처리 로직 재사용)
        ProjectListItemResponse base = new ProjectListItemResponse(p);
        Item.Owner owner = null;
        if (base.getOwner() != null) {
            var o = base.getOwner();
            owner = new Item.Owner(o.getId(), o.getNickname(), o.getAvatarUrl(), o.getUsername()); // email 제외
        }
        return new Item(
                base.getId(),
                base.getTitle(),
                base.getDescription(),
                base.getCoverUrl(),
                base.getIsTeam(),
                base.getUsername(),
                base.getShareUrl(),
                base.getQrImageUrl(),
                owner
        );
    }
}
