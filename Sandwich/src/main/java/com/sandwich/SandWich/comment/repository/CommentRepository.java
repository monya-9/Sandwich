package com.sandwich.SandWich.comment.repository;

import com.sandwich.SandWich.comment.domain.Comment;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    @Query("SELECT c FROM Comment c WHERE c.user.isDeleted = false")
    List<Comment> findAllByUserIsNotDeleted();
    List<Comment> findAllByUser(User user);
    List<Comment> findByCommentableTypeAndCommentableIdAndParentCommentIsNullOrderByCreatedAtDesc(String commentableType, Long commentableId);
    long countByCommentableTypeAndCommentableId(String commentableType, Long commentableId);
    @Query("select c.user.id from Comment c where c.id = :id")
    Optional<Long> findAuthorIdById(@Param("id") Long id);
}