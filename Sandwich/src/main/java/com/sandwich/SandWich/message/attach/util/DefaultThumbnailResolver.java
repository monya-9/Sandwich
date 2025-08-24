package com.sandwich.SandWich.message.attach.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.message.attach.repository.AttachmentMetadataRepository;
import com.sandwich.SandWich.message.attach.storage.StorageService;
import com.sandwich.SandWich.message.domain.Message;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;

public class DefaultThumbnailResolver implements ThumbnailResolver {
    private static final ObjectMapper M = new ObjectMapper();

    private final AttachmentMetadataRepository repo;
    private final StorageService storage;

    public DefaultThumbnailResolver(AttachmentMetadataRepository repo, StorageService storage) {
        this.repo = repo;
        this.storage = storage;
    }

    @Override
    public BufferedImage resolveFor(Message m) {
        try {
            if (m.getPayload() == null) return null;

            JsonNode n = M.readTree(m.getPayload());
            String mime = n.path("mime").asText(null);
            if (mime == null || !mime.startsWith("image/")) return null;

            // "/api/files/{filename}" 에서 filename 추출
            String url = n.path("url").asText(null);
            if (url == null) return null;
            int slash = url.lastIndexOf('/');
            if (slash < 0 || slash == url.length() - 1) return null;
            String filename = url.substring(slash + 1);

            var mdOpt = repo.findByFilename(filename);
            if (mdOpt.isEmpty()) return null;
            var md = mdOpt.get();
            if (md.getThumbnailKey() == null) return null;

            byte[] bytes = storage.load(md.getThumbnailKey());
            if (bytes == null || bytes.length == 0) return null;

            return ImageIO.read(new ByteArrayInputStream(bytes));
        } catch (Exception e) {
            return null; // 실패 시 썸네일 미표시
        }
    }
}