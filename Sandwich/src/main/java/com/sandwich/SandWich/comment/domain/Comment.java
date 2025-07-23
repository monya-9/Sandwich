package com.sandwich.SandWich.comment.domain;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Comment extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 댓글 작성자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // 댓글이 달린 대상의 타입 (예: "Project", "Post")
    private String commentableType;
    private Long commentableId;

    // 댓글이 달린 대상의 ID (예: project_id or post_id)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    // 대댓글 목록 (양방향 매핑)
    // 부모 댓글 삭제 시 대댓글도 함께 삭제
    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> subComments = new ArrayList<>();

    // 댓글 내용
    @Column(nullable = false, length = 1000)
    private String comment;
}