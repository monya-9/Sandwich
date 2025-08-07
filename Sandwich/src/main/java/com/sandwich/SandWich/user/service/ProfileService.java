package com.sandwich.SandWich.user.service;

import com.sandwich.SandWich.user.domain.User;

public interface ProfileService {
    long getSavedCollectionCount(User user);       // 나
    long getSavedCollectionCount(Long userId);     // 타인
}
