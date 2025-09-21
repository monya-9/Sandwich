package com.sandwich.SandWich.message.service;

import com.microsoft.playwright.*;
import com.sandwich.SandWich.common.exception.exceptiontype.InvalidRangeException;
import com.sandwich.SandWich.common.exception.exceptiontype.ScreenshotTooLargeException;
import com.sandwich.SandWich.common.exception.exceptiontype.*;
import com.sandwich.SandWich.message.attach.repository.AttachmentMetadataRepository;
import com.sandwich.SandWich.message.attach.storage.StorageService;
import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.dto.MessageType;
import com.sandwich.SandWich.message.repository.MessageRepository;
import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.screenshot.config.ScreenshotProperties;
import com.sandwich.SandWich.message.util.ChatScreenshotHtmlRenderer;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MessageScreenshotService {

    private final MessageRoomRepository roomRepo;
    private final MessageRepository messageRepo;
    private final AttachmentMetadataRepository attachmentMetadataRepository;
    private final StorageService storageService;
    private final Browser browser;
    private final ScreenshotProperties props;

    private static final com.fasterxml.jackson.databind.ObjectMapper M =
            new com.fasterxml.jackson.databind.ObjectMapper();
    @Transactional(readOnly = true)
    public byte[] screenshotRoom(User me, Long roomId, Integer width, String theme, ZoneId zone) {
        var room = roomRepo.findById(roomId).orElseThrow(MessageRoomNotFoundException::new);
        Long u1 = room.getUser1().getId(), u2 = room.getUser2().getId();
        if (!me.getId().equals(u1) && !me.getId().equals(u2)) throw new MessageRoomForbiddenException();

        var list = messageRepo.findAllByRoomIdOrderByCreatedAtAsc(roomId);
        var thumbDataUrls = buildThumbDataUrls(list);

        int w = (width != null ? width : 900);
        String th = (theme == null ? "light" : theme);

        String html = ChatScreenshotHtmlRenderer.buildHtml(list, me.getId(), w, th, zone, thumbDataUrls);

        try (BrowserContext context = browser.newContext(
                new Browser.NewContextOptions().setViewportSize(w, 800))) {

            Page page = context.newPage();
            page.setDefaultTimeout(props.getTimeoutMs());

            page.setContent(html, new Page.SetContentOptions()
                    .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.NETWORKIDLE));

            return page.screenshot(new Page.ScreenshotOptions()
                    .setFullPage(true)
                    .setType(com.microsoft.playwright.options.ScreenshotType.PNG));
        }
    }

    // 뷰포트 범위 PNG
    @Transactional(readOnly = true)
    public byte[] screenshotRangePng(Long meId, Long roomId, long fromId, long toId,
                                     int width, String theme, int scale, ZoneId zone) {

        validateRange(fromId, toId);
        ensureParticipant(meId, roomId);

        var list = messageRepo.findRangeAscNotDeletedWithSender(roomId, fromId, toId);
        if (list.isEmpty()) {
            throw new MessageNotFoundException();
        }

        if (list.size() > props.getMaxCount()) {
            throw new ScreenshotTooLargeException(list.size(), props.getMaxCount());
        }

        var thumbs = buildThumbDataUrls(list);
        String html = ChatScreenshotHtmlRenderer.buildHtml(list, meId, width, theme, zone, thumbs);

        try (BrowserContext context = browser.newContext(
                new Browser.NewContextOptions().setViewportSize(width, 800))) {

            Page page = context.newPage();
            page.setDefaultTimeout(props.getTimeoutMs());
            page.setContent(html, new Page.SetContentOptions()
                    .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.NETWORKIDLE));

            return page.screenshot(new Page.ScreenshotOptions()
                    .setFullPage(true)
                    .setScale(com.microsoft.playwright.options.ScreenshotScale.CSS)
                    .setType(com.microsoft.playwright.options.ScreenshotType.PNG));
        }
    }

    // 뷰포트 범위 PDF
    @Transactional(readOnly = true)
    public byte[] screenshotRangePdf(Long meId, Long roomId, long fromId, long toId,
                                     int width, String theme, ZoneId zone) {

        validateRange(fromId, toId);
        ensureParticipant(meId, roomId);

        var list = messageRepo.findRangeAscNotDeletedWithSender(roomId, fromId, toId);
        if (list.isEmpty()) throw new NotFoundException("No messages in range");
        if (list.size() > props.getMaxCount()) {
            throw new PayloadTooLargeException("Too many messages in range (" + list.size() + " > " + props.getMaxCount() + ")");
        }

        var thumbs = buildThumbDataUrls(list);
        String html = ChatScreenshotHtmlRenderer.buildHtml(list, meId, width, theme, zone, thumbs);

        try (BrowserContext context = browser.newContext(
                new Browser.NewContextOptions().setViewportSize(width, 800))) {

            Page page = context.newPage();
            page.setDefaultTimeout(props.getTimeoutMs());
            page.setContent(html, new Page.SetContentOptions()
                    .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.NETWORKIDLE));

            return page.pdf(new Page.PdfOptions().setPrintBackground(true));
        }
    }

    // ───── 내부 유틸 ─────
    private void ensureParticipant(Long meId, Long roomId) {
        if (!roomRepo.isParticipant(roomId, meId)) throw new MessageRoomForbiddenException();
    }

    private void validateRange(long fromId, long toId) {
        if (fromId <= 0 || toId <= 0 || fromId > toId) throw new InvalidRangeException();
    }

    private Map<Long, String> buildThumbDataUrls(List<Message> list) {
        Map<Long, String> map = new HashMap<>();
        for (Message m : list) {
            if (m.getType() != MessageType.ATTACHMENT) continue;
            String mime = jsonVal(m.getPayload(), "mime");
            if (mime == null || !mime.startsWith("image/")) continue;

            String url = jsonVal(m.getPayload(), "url");
            if (url == null) continue;
            int idx = url.lastIndexOf('/');
            if (idx < 0 || idx == url.length() - 1) continue;
            String filename = url.substring(idx + 1);

            var mdOpt = attachmentMetadataRepository.findByFilename(filename);
            if (mdOpt.isEmpty()) continue;
            var md = mdOpt.get();
            if (md.getThumbnailKey() == null) continue;

            byte[] bytes = storageService.load(md.getThumbnailKey());
            if (bytes == null || bytes.length == 0) continue;

            String keyLower = md.getThumbnailKey().toLowerCase();
            String outMime = keyLower.endsWith(".png") ? "image/png"
                    : keyLower.endsWith(".webp") ? "image/webp"
                    : "image/jpeg";
            String b64 = Base64.getEncoder().encodeToString(bytes);
            map.put(m.getId(), "data:" + outMime + ";base64," + b64);
        }
        return map;
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