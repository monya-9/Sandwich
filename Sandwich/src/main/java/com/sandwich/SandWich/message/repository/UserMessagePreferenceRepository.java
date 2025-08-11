package com.sandwich.SandWich.message.repository;

import com.sandwich.SandWich.message.domain.UserMessagePreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserMessagePreferenceRepository extends JpaRepository<UserMessagePreference, Long> {
    Optional<UserMessagePreference> findByUserId(Long userId);
}