package com.sandwich.SandWich.message.service;

import com.sandwich.SandWich.global.exception.exceptiontype.MessageRoomForbiddenException;
import com.sandwich.SandWich.global.exception.exceptiontype.MessageRoomNotFoundException;
import com.sandwich.SandWich.message.attach.repository.AttachmentMetadataRepository;
import com.sandwich.SandWich.message.attach.storage.StorageService;
import com.sandwich.SandWich.message.repository.MessageRepository;
import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.util.ChatScreenshotHtmlRenderer;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.microsoft.playwright.*;

@Service
@RequiredArgsConstructor
public class MessageScreenshotService {
    private final MessageRoomRepository roomRepo;
    private final MessageRepository messageRepo;
    private final AttachmentMetadataRepository attachmentMetadataRepository;
    private final StorageService storageService;
    private final Browser browser;
    private static final com.fasterxml.jackson.databind.ObjectMapper M = new com.fasterxml.jackson.databind.ObjectMapper();


    @Transactional(readOnly = true)
    public byte[] screenshotRoom(User me, Long roomId, Integer width, String theme, java.time.ZoneId zone) {
        var room = roomRepo.findById(roomId).orElseThrow(MessageRoomNotFoundException::new);
        Long u1 = room.getUser1().getId(), u2 = room.getUser2().getId();
        if (!me.getId().equals(u1) && !me.getId().equals(u2)) throw new MessageRoomForbiddenException();

        var list = messageRepo.findAllByRoomIdOrderByCreatedAtAsc(roomId);

        // ★ 메시지ID -> 썸네일 data URL 매핑 (없으면 키만 있고 값 null)
        java.util.Map<Long, String> thumbDataUrls = new java.util.HashMap<>();
        for (var m : list) {
            if (m.getType() != com.sandwich.SandWich.message.dto.MessageType.ATTACHMENT) continue;
            String mime = jsonVal(m.getPayload(), "mime");
            if (mime == null || !mime.startsWith("image/")) continue;

            // payload.url: "/api/files/{filename}" 형태 → filename 추출
            String url = jsonVal(m.getPayload(), "url");
            if (url == null) continue;
            int idx = url.lastIndexOf('/');
            if (idx < 0 || idx == url.length() - 1) continue;
            String filename = url.substring(idx + 1);

            var mdOpt = attachmentMetadataRepository.findByFilename(filename);
            if (mdOpt.isEmpty()) continue;
            var md = mdOpt.get();
            if (md.getThumbnailKey() == null) continue;

            // 썸네일 바이트 로드 → data URL
            byte[] bytes = storageService.load(md.getThumbnailKey());  // Local/S3 구현 필요(이미 있으실 거예요)
            if (bytes == null || bytes.length == 0) continue;

            String b64 = java.util.Base64.getEncoder().encodeToString(bytes);
            // ⬇썸네일 키 확장자로 MIME 추론
            String mime2 = "image/jpeg";
            String keyLower = md.getThumbnailKey().toLowerCase();
            if (keyLower.endsWith(".png"))  mime2 = "image/png";
            else if (keyLower.endsWith(".webp")) mime2 = "image/webp";

            String dataUrl = "data:" + mime2 + ";base64," + b64;
            thumbDataUrls.put(m.getId(), dataUrl);
        }

        int w = (width != null ? width : 900);
        String th = (theme == null ? "light" : theme);

        // ★ buildHtml에 썸네일 매핑을 넘김
        String html = ChatScreenshotHtmlRenderer.buildHtml(
                list, me.getId(), w, th, zone, thumbDataUrls);

        try (BrowserContext context = browser.newContext(
                new Browser.NewContextOptions().setViewportSize(w, 800))) {

            Page page = context.newPage();
            page.setDefaultTimeout(15_000); // 타임아웃 가드 (권장)

            page.setContent(html, new Page.SetContentOptions()
                    .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.NETWORKIDLE));

            byte[] png = page.screenshot(new Page.ScreenshotOptions()
                    .setFullPage(true)
                    .setType(com.microsoft.playwright.options.ScreenshotType.PNG));

            return png;
        }

    }

    private static String jsonVal(String json, String key) {
        if (json == null) return null;
        try {
            var n = M.readTree(json);
            var v = n.get(key);
            return v == null ? null : v.asText();
        } catch (Exception e) {
            return null;
        }
    }

}
