package com.sandwich.SandWich.message.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.ScreenshotType;
import com.microsoft.playwright.options.WaitUntilState;
import com.sandwich.SandWich.global.exception.exceptiontype.MessageRoomForbiddenException;
import com.sandwich.SandWich.global.exception.exceptiontype.MessageRoomNotFoundException;
import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.repository.MessageRepository;
import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.util.ChatScreenshotHtmlRenderer;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageScreenshotService {
    private final MessageRoomRepository roomRepo;
    private final MessageRepository messageRepo;

    @Transactional(readOnly = true)
    public byte[] screenshotRoom(User me, Long roomId, Integer width, String theme, java.time.ZoneId zone) {
        var room = roomRepo.findById(roomId).orElseThrow(MessageRoomNotFoundException::new);
        Long u1 = room.getUser1().getId(), u2 = room.getUser2().getId();
        if (!me.getId().equals(u1) && !me.getId().equals(u2)) throw new MessageRoomForbiddenException();

        List<Message> list = messageRepo.findAllByRoomIdOrderByCreatedAtAsc(roomId);
        String html = ChatScreenshotHtmlRenderer.buildHtml(
                list,
                me.getId(),
                width != null ? width : 900,
                theme == null ? "light" : theme,
                zone
        );

        try (Playwright pw = Playwright.create()) {
            Browser browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            BrowserContext context = browser.newContext(
                    new Browser.NewContextOptions().setViewportSize(width != null ? width : 900, 800)
            );
            Page page = context.newPage();

            page.setContent(html, new Page.SetContentOptions().setWaitUntil(WaitUntilState.NETWORKIDLE));

            byte[] png = page.screenshot(
                    new Page.ScreenshotOptions().setFullPage(true).setType(ScreenshotType.PNG)
            );
            context.close();
            browser.close();
            return png;
        }
    }

}
