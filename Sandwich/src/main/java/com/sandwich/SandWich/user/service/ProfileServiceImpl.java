package com.sandwich.SandWich.user.service;

import com.sandwich.SandWich.collection.repository.CollectionItemRepository;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final CollectionItemRepository collectionItemRepository;

    @Override
    public long getSavedCollectionCount(User user) {
        return collectionItemRepository.countBySavedProjectsOfUser(user.getId());
    }

    @Override
    public long getSavedCollectionCount(Long userId) {
        return collectionItemRepository.countBySavedProjectsOfUser(userId);
    }
}
