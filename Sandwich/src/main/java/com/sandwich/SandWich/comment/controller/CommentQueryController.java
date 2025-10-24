package com.sandwich.SandWich.comment.controller;

import com.sandwich.SandWich.comment.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/comments")
public class CommentQueryController {

    private final CommentRepository commentRepository;

    @GetMapping("/count")
    public Map<String, Long> count(
            @RequestParam("type") String type,
            @RequestParam("id") Long id
    ) {
        long c = commentRepository.countByCommentableTypeAndCommentableId(type, id);
        return Map.of("count", c);
    }
}