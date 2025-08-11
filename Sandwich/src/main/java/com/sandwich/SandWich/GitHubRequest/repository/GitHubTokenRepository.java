package com.sandwich.SandWich.GitHubRequest.repository;

import com.sandwich.SandWich.GitHubRequest.domain.UserGitHubToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GitHubTokenRepository extends JpaRepository<UserGitHubToken, Long> {
    Optional<UserGitHubToken> findByUserIdAndProjectId(Long userId, Long projectId);
}

