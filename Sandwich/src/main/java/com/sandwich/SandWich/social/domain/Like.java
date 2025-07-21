package com.sandwich.SandWich.social.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "likes")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Like extends BaseEntity {
  
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // 👍 다형성 적용된 필드
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LikeTargetType targetType;

    @Column(nullable = false)
    private Long targetId;

    public Like(User user, LikeTargetType targetType, Long targetId) {
        this.user = user;
        this.targetType = targetType;
        this.targetId = targetId;
    }

}