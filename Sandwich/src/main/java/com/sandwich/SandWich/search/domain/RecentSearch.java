package com.sandwich.SandWich.search.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "recent_search",
        indexes = {
                @Index(name = "idx_recent_user_updated", columnList = "user_id, updated_at"),
                @Index(name = "idx_recent_user_type", columnList = "user_id, type")
        }
)
public class RecentSearch extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecentSearchType type; // PORTFOLIO or ACCOUNT

    @Column(nullable = false, length = 200)
    private String keyword;

    public void touchKeyword(String newKeyword) {
        this.keyword = newKeyword;
        // updatedAt은 BaseEntity가 자동 갱신
    }
}