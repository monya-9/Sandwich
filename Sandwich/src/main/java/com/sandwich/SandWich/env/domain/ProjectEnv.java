package com.sandwich.SandWich.env.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "project_env")
public class ProjectEnv {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long projectId;
    private String keyName;

    @Column(length = 2048)
    private String valueEncrypted;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
