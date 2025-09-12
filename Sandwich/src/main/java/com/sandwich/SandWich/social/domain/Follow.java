package com.sandwich.SandWich.social.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "follow",
        uniqueConstraints = @UniqueConstraint(name="uk_follow_pair", columnNames={"follower_id","following_id"}),
        indexes = {
                @Index(name="idx_follow_following", columnList="following_id"),
                @Index(name="idx_follow_follower",  columnList="follower_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Follow extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 팔로우 하는 사람
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    // 팔로우 당하는 사람
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "following_id", nullable = false)
    private User following;


    public Follow(User follower, User following) {
        this.follower = follower;
        this.following = following;
    }
}
