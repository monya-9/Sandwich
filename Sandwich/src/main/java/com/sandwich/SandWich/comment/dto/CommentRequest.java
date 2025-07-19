package com.sandwich.SandWich.comment.dto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentRequest {
    private String commentableType; // 예: "Project"
    private Long commentableId;     // 예: 123
    private Long parentCommentId;   // null이면 일반 댓글
    private String comment;         // 댓글 내용
}