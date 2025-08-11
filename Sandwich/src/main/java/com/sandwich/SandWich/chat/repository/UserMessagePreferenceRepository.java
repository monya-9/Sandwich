package com.sandwich.SandWich.chat.repository;

import com.sandwich.SandWich.chat.domain.UserMessagePreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserMessagePreferenceRepository extends JpaRepository<UserMessagePreference, Long> {
    Optional<UserMessagePreference> findByUserId(Long userId);
}