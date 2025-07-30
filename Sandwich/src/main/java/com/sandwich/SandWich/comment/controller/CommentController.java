package com.sandwich.SandWich.comment.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.comment.dto.CommentRequest;
import com.sandwich.SandWich.comment.dto.CommentResponse;
import com.sandwich.SandWich.comment.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody CommentRequest request,
                                       @AuthenticationPrincipal UserDetailsImpl user) {
        commentService.create(request, user.getUser().getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @RequestBody CommentRequest request,
                                       @AuthenticationPrincipal UserDetailsImpl user) {
        commentService.update(id, request.getComment(), user.getUser().getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal UserDetailsImpl user) {
        commentService.delete(id, user.getUser().getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(@RequestParam String type,
                                                             @RequestParam Long id) {
        return ResponseEntity.ok(commentService.getComments(type, id));
    }
}