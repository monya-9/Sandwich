package com.sandwich.SandWich.message.attach.util;

import com.sandwich.SandWich.global.exception.exceptiontype.BadRequestException;
import com.sandwich.SandWich.global.exception.exceptiontype.PayloadTooLargeException;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;

public final class AttachmentValidator {
    private AttachmentValidator() {}

    public static void validateBasic(MultipartFile file, long maxBytes,
                                     Set<String> allowedExt, Set<String> allowedMime) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("파일이 비어있습니다.");
        }
        if (file.getSize() > maxBytes) {
            throw new PayloadTooLargeException("파일 용량 초과");
        }

        String original = safeOriginalName(file.getOriginalFilename());
        String ext = getLowerExt(original);
        if (!allowedExt.contains(ext)) {
            throw new BadRequestException("허용되지 않은 확장자");
        }

        String mime = safeContentType(file.getContentType());
        if (!allowedMime.contains(mime)) {
            throw new BadRequestException("허용되지 않은 MIME 타입");
        }

        // 콘텐츠 스니핑
        try {
            if ("application/pdf".equals(mime)) {
                try (InputStream in = file.getInputStream()) {
                    byte[] head = in.readNBytes(5);
                    String sig = new String(head, StandardCharsets.US_ASCII);
                    if (!sig.startsWith("%PDF-")) {
                        throw new BadRequestException("PDF 서명이 아닙니다.");
                    }
                }
            } else if (mime.startsWith("image/")) {
                try (InputStream in2 = file.getInputStream()) {
                    BufferedImage bi = ImageIO.read(in2);
                    if (bi == null) {
                        throw new BadRequestException("손상된 이미지이거나 이미지가 아닙니다.");
                    }
                }
            }
        } catch (BadRequestException e) {
            // 위에서 우리가 던진 커스텀 예외는 그대로 통과
            throw e;
        } catch (Exception e) {
            // 그 외 모든 예외는 400으로 정규화
            throw new BadRequestException("파일 내용 검사 실패");
        }
    }

    public static String safeOriginalName(String raw) {
        if (raw == null) return "unknown";
        String name = raw.replace("\\", "/");
        name = name.substring(name.lastIndexOf('/') + 1);

        // 경로 트래버설/숨김 파일 방지
        if (name.contains("..")) {
            throw new BadRequestException("의심스러운 파일명");
        }
        if (name.startsWith(".")) { // .env, .htaccess 등 숨김/확장자 없는 형태
            throw new BadRequestException("유효하지 않은 파일명");
        }

        // 확장자 존재 여부 확인
        int lastDot = name.lastIndexOf('.');
        if (lastDot <= 0 || lastDot == name.length() - 1) {
            throw new BadRequestException("확장자가 없습니다.");
        }
        return name;
    }

    public static String getLowerExt(String name) {
        int i = name.lastIndexOf('.');
        if (i < 0) return "";
        return name.substring(i + 1).toLowerCase();
    }

    public static String safeContentType(String ct) {
        return ct == null ? "application/octet-stream" : ct.trim().toLowerCase();
    }
}
