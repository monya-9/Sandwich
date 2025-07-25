package com.sandwich.SandWich.social.domain;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;


@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Follow extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id")
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "followed_id")
    private User followed;
}
