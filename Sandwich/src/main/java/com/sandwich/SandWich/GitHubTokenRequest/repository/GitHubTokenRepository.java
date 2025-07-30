package com.sandwich.SandWich.GitHubTokenRequest.repository;

import com.sandwich.SandWich.GitHubTokenRequest.domain.UserGitHubToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GitHubTokenRepository extends JpaRepository<UserGitHubToken, Long> {
    Optional<UserGitHubToken> findByUserIdAndProjectId(Long userId, Long projectId);
}

