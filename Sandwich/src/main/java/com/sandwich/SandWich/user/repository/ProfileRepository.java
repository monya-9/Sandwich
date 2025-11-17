package com.sandwich.SandWich.user.repository;

import com.sandwich.SandWich.user.domain.Profile;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Profile findByUser(User user);
    boolean existsByNickname(String nickname);
    boolean existsByProfileSlug(String profileSlug);
    Optional<Profile> findByProfileSlug(String profileSlug);
}