package com.sandwich.SandWich.collection.repository;

import com.sandwich.SandWich.collection.domain.CollectionFolder;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CollectionFolderRepository extends JpaRepository<CollectionFolder, Long> {
    List<CollectionFolder> findByUser(User user);
    List<CollectionFolder> findByUserIdAndIsPrivateFalse(Long userId);
}

