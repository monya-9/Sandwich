package com.sandwich.SandWich.message.attach.service;
import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.message.attach.config.FileSecurityProperties;
import com.sandwich.SandWich.message.attach.domain.AttachmentMetadata;
import com.sandwich.SandWich.message.attach.repository.AttachmentMetadataRepository;
import com.sandwich.SandWich.message.attach.storage.StorageService;
import com.sandwich.SandWich.message.attach.util.AttachmentValidator;
import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.service.MessageService;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.URL;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final FileSecurityProperties props;
    private final StorageService storage;
    private final AttachmentMetadataRepository repo;

    // 통합: 권한 체크/메시지 생성
    private final MessageRoomRepository roomRepo;
    private final MessageService messageService;

    private void assertMemberOrThrow(Long roomId, Long userId) {
        boolean ok = roomRepo.isParticipant(roomId, userId);
        if (!ok) throw new org.springframework.security.access.AccessDeniedException("해당 채팅방에 접근 권한이 없습니다.");
    }

    @Transactional
    public Object upload(Long roomId, User me, MultipartFile file) {
        assertMemberOrThrow(roomId, me.getId());

        long maxBytes = props.getMaxSizeMb() * 1024L * 1024L;
        AttachmentValidator.validateBasic(file, maxBytes, props.extSet(), props.mimeSet());

        String original = AttachmentValidator.safeOriginalName(file.getOriginalFilename());
        String ext = AttachmentValidator.getLowerExt(original);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String filename = uuid + "." + ext;

        String mime = AttachmentValidator.safeContentType(file.getContentType());

        String key = ("s3".equalsIgnoreCase(props.getStorage())
                ? props.getS3().getKeyPrefix()
                : "") + "messages/" + roomId + "/" + filename;

        try {
            storage.save(file.getBytes(), key, mime);
        } catch (Exception e) {
            throw new RuntimeException("파일 저장 실패");
        }

        AttachmentMetadata md = AttachmentMetadata.builder()
                .filename(filename)
                .originalFilename(original)
                .mimeType(mime)
                .size(file.getSize())
                .roomId(roomId)
                .uploader(me)
                .storageKey(key)
                .build();
        repo.save(md);

        String fileUrl = "/api/files/" + filename; // 보호 URL
        return messageService.createAttachmentMessage(roomId, me, fileUrl, original, mime, file.getSize());
    }

    @Transactional(readOnly = true)
    public AttachmentMetadata getForDownload(String filename, Long requesterId) {
        AttachmentMetadata md = repo.findByFilename(filename)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다."));
        assertMemberOrThrow(md.getRoomId(), requesterId);
        return md;
    }

    public URL presignIfS3(String storageKey) {
        if ("s3".equalsIgnoreCase(props.getStorage())) {
            return storage.presignedGetUrl(storageKey, Duration.ofMinutes(2));
        }
        return null;
    }
}