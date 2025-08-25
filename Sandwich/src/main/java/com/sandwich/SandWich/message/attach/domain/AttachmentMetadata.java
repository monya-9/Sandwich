package com.sandwich.SandWich.message.attach.domain;

import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "attachment_metadata", indexes = {
        @Index(name="idx_attach_filename", columnList = "filename", unique = true),
        @Index(name="idx_attach_room", columnList = "roomId")
})
public class AttachmentMetadata {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true, length=80)
    private String filename;           // uuid.ext

    @Column(nullable=false, length=255)
    private String originalFilename;

    @Column(nullable=false, length=80)
    private String mimeType;

    @Column(nullable=false)
    private long size;

    @Column(nullable=false)
    private Long roomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable=false)
    private User uploader;

    @Column(nullable=false, length=512)
    private String storageKey;

    private String thumbnailKey;
}