package com.sandwich.SandWich.collection.service;

import com.sandwich.SandWich.collection.dto.*;
import com.sandwich.SandWich.user.domain.User;

import java.util.List;

public interface CollectionService {
    Long createFolder(User user, CollectionFolderRequest request);
    List<CollectionFolderResponse> getMyFolders(User user);
    void addProjectToFolders(User user, AddToCollectionRequest request);
    void removeProjectFromFolder(User user, RemoveFromCollectionRequest request);
    CollectionFolderDetailResponse getFolderDetail(User user, Long folderId);
    void updateFolder(User user, Long folderId, CollectionFolderRequest request);
    void deleteFolder(User user, Long folderId);

    // 공개 컬렉션 목록(마이페이지에서 타인이 볼 때)
    List<CollectionFolderResponse> listPublicFoldersOfUser(Long userId);
}

