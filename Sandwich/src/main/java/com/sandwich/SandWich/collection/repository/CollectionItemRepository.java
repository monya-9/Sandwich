package com.sandwich.SandWich.collection.repository;

import com.sandwich.SandWich.collection.domain.CollectionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CollectionItemRepository extends JpaRepository<CollectionItem, Long> {
    boolean existsByFolderIdAndProjectId(Long folderId, Long projectId);
    void deleteByFolderIdAndProjectId(Long folderId, Long projectId);
    List<CollectionItem> findByFolderId(Long folderId);
    @Query("""
    SELECT COUNT(ci)
    FROM CollectionItem ci
    JOIN ci.project p
    JOIN ci.folder f
    WHERE p.user.id = :userId
    AND f.user.id != :userId""")
    long countBySavedProjectsOfUser(@Param("userId") Long userId);

}