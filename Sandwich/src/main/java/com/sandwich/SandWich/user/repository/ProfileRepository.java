package com.sandwich.SandWich.user.repository;

import com.sandwich.SandWich.user.domain.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
}