package com.sandwich.SandWich.post.repository;


import com.sandwich.SandWich.post.domain.Post;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {
    @Query("SELECT p FROM Post p WHERE p.user.isDeleted = false")
    List<Post> findAllByUserIsNotDeleted();
    List<Post> findAllByUser(User user);
    @Query("select p.user.id from Post p where p.id = :id")
    Optional<Long> findAuthorIdById(@Param("id") Long id);
}