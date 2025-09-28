package com.sandwich.SandWich.collection.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.collection.dto.*;
import com.sandwich.SandWich.collection.service.CollectionService;
import com.sandwich.SandWich.user.domain.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @PostMapping("/folders")
    public ResponseEntity<Long> createFolder(
            @RequestBody @Valid CollectionFolderRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        User user = userDetails.getUser();
        System.out.println("isPrivate = " + request.isPrivate());  // true / false 확인
        return ResponseEntity.ok(collectionService.createFolder(user, request));
    }

    @GetMapping("/folders/me")
    public ResponseEntity<List<CollectionFolderResponse>> getMyFolders(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(collectionService.getMyFolders(userDetails.getUser()));
    }

    // 특정 사용자 공개 컬렉션 목록
    @GetMapping("/folders/user/{userId}")
    public ResponseEntity<List<CollectionFolderResponse>> listPublicFoldersOfUser(@PathVariable Long userId) {
        return ResponseEntity.ok(collectionService.listPublicFoldersOfUser(userId));
    }

    @PostMapping
    public ResponseEntity<Void> addProjectToFolders(
            @RequestBody AddToCollectionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        collectionService.addProjectToFolders(userDetails.getUser(), request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> removeProject(
            @RequestBody RemoveFromCollectionRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        collectionService.removeProjectFromFolder(userDetails.getUser(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/folders/{id}")
    public ResponseEntity<CollectionFolderDetailResponse> getFolderDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        User user = (userDetails != null) ? userDetails.getUser() : null;
        return ResponseEntity.ok(collectionService.getFolderDetail(user, id));
    }

    @PutMapping("/folders/{id}")
    public ResponseEntity<Void> updateFolder(
            @PathVariable Long id,
            @RequestBody CollectionFolderRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        collectionService.updateFolder(userDetails.getUser(), id, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/folders/{id}")
    public ResponseEntity<Void> deleteFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        collectionService.deleteFolder(userDetails.getUser(), id);
        return ResponseEntity.ok().build();
    }
}