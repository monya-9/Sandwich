package com.sandwich.SandWich.community.repository;


import com.sandwich.SandWich.community.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    @Query("SELECT p FROM Post p WHERE p.user.isDeleted = false")
    List<Post> findAllByUserIsNotDeleted();
}