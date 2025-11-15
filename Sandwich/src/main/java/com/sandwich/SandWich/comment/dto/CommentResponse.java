package com.sandwich.SandWich.comment.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommentResponse {
    private Long id;
    private String comment;
    private Long userId;
    private String username;
    private String profileImageUrl;
    private OffsetDateTime createdAt;
    private List<CommentResponse> subComments; // 대댓글
}