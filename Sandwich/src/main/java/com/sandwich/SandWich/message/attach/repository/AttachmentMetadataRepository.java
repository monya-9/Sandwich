package com.sandwich.SandWich.message.attach.repository;

import com.sandwich.SandWich.message.attach.domain.AttachmentMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AttachmentMetadataRepository extends JpaRepository<AttachmentMetadata, Long> {
    Optional<AttachmentMetadata> findByFilename(String filename);
}