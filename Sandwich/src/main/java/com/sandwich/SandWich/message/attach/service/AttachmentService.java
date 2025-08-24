package com.sandwich.SandWich.message.attach.service;
import jakarta.annotation.PostConstruct;
import com.sandwich.SandWich.message.attach.config.FileSecurityProperties;
import com.sandwich.SandWich.message.attach.domain.AttachmentMetadata;
import com.sandwich.SandWich.message.attach.repository.AttachmentMetadataRepository;
import com.sandwich.SandWich.message.attach.storage.StorageService;
import com.sandwich.SandWich.message.attach.util.AttachmentValidator;
import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.service.MessageService;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.time.Duration;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final FileSecurityProperties props;
    private final StorageService storage;
    private final AttachmentMetadataRepository repo;
    private final MessageRoomRepository roomRepo;
    private final MessageService messageService;

    @PostConstruct
    void logStorageImpl() {
        log.info("[Storage] Using implementation: {}", storage.getClass().getSimpleName());
    }

    private void assertMemberOrThrow(Long roomId, Long userId) {
        boolean ok = roomRepo.isParticipant(roomId, userId);
        if (!ok) throw new AccessDeniedException("해당 채팅방에 접근 권한이 없습니다.");
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

        // 1) 업로드 직전에 파일 바이트 한 번만 확보
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("파일 읽기 실패", e);
        }

        // 2) 저장
        try {
            storage.save(fileBytes, key, mime);
        } catch (Exception e) {
            throw new RuntimeException("파일 저장 실패", e);
        }

        // 2) 썸네일 (이미지일 때)
        String thumbKey = null;
        if (mime.startsWith("image/")) {
            try {
                BufferedImage src = ImageIO.read(new ByteArrayInputStream(fileBytes));
                if (src != null) {
                    final int max = 256;
                    int w = src.getWidth(), h = src.getHeight();
                    float ratio = Math.min(1f, (float) max / Math.max(w, h));
                    int tw = Math.max(1, Math.round(w * ratio));
                    int th = Math.max(1, Math.round(h * ratio));

                    Image scaled = src.getScaledInstance(tw, th, Image.SCALE_SMOOTH);
                    BufferedImage thumb = new BufferedImage(tw, th, BufferedImage.TYPE_INT_RGB);
                    Graphics2D g = thumb.createGraphics();
                    g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                    g.drawImage(scaled, 0, 0, null);
                    g.dispose();

                    ByteArrayOutputStream bos = new ByteArrayOutputStream();
                    ImageIO.write(thumb, "jpg", bos);
                    byte[] thumbBytes = bos.toByteArray();

                    thumbKey = ("s3".equalsIgnoreCase(props.getStorage()) ? props.getS3().getKeyPrefix() : "")
                            + "thumbnails/messages/" + roomId + "/" + uuid + ".jpg";

                    storage.save(thumbBytes, thumbKey, "image/jpeg");
                }
            } catch (Exception ignore) {
                // 썸네일 실패는 무시 (로그만)
                // log.warn("썸네일 생성 실패: {}", ignore.getMessage());
            }
        }

        AttachmentMetadata md = AttachmentMetadata.builder()
                .filename(filename)
                .originalFilename(original)
                .mimeType(mime)
                .size(file.getSize())
                .roomId(roomId)
                .uploader(me)
                .storageKey(key)
                .thumbnailKey(thumbKey)
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