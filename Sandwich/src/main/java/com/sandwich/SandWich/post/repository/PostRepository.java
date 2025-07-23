package com.sandwich.SandWich.post.repository;


import com.sandwich.SandWich.post.domain.Post;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    @Query("SELECT p FROM Post p WHERE p.user.isDeleted = false")
    List<Post> findAllByUserIsNotDeleted();
    List<Post> findAllByUser(User user);
}