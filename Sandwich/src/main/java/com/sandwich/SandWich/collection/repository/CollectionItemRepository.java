package com.sandwich.SandWich.collection.repository;

import com.sandwich.SandWich.collection.domain.CollectionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CollectionItemRepository extends JpaRepository<CollectionItem, Long> {
    boolean existsByFolderIdAndProjectId(Long folderId, Long projectId);
    void deleteByFolderIdAndProjectId(Long folderId, Long projectId);
    List<CollectionItem> findByFolderId(Long folderId);
}