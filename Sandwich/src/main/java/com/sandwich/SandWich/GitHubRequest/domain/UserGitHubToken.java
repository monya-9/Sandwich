package com.sandwich.SandWich.GitHubRequest.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_github_tokens")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGitHubToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long projectId;

    private String encryptedToken;

    public UserGitHubToken(Long userId, Long projectId) {
        this.userId = userId;
        this.projectId = projectId;
    }

    public void setEncryptedToken(String encryptedToken) {
        this.encryptedToken = encryptedToken;
    }
}
