package com.sandwich.SandWich.comment.repository;

import com.sandwich.SandWich.comment.domain.Comment;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    @Query("SELECT c FROM Comment c WHERE c.user.isDeleted = false")
    List<Comment> findAllByUserIsNotDeleted();
    List<Comment> findAllByUser(User user);
    List<Comment> findByCommentableTypeAndCommentableIdAndParentCommentIsNullOrderByCreatedAtDesc(String commentableType, Long commentableId);
    long countByCommentableTypeAndCommentableId(String commentableType, Long commentableId);

}