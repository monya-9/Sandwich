package com.sandwich.SandWich.message.util;

import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.dto.MessageType;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Collections;


public class ChatScreenshotHtmlRenderer {
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // (A) 기존 5-인자 시그니처는 유지하되, 내부에서 6-인자 버전으로 위임
    public static String buildHtml(List<Message> messages, Long meId, int width, String theme, ZoneId zone) {
        return buildHtml(messages, meId, width, theme, zone, java.util.Collections.emptyMap());
    }

    // 6-인자: 썸네일 data URL 맵 포함
    public static String buildHtml(List<Message> messages, Long meId, int width, String theme, ZoneId zone,
                                   Map<Long, String> thumbDataUrls) {
        String bg    = "dark".equals(theme) ? "#0b1220" : "#f5f7fa";
        String meBg  = "dark".equals(theme) ? "#244c77" : "#d2e9ff";
        String other = "dark".equals(theme) ? "#101826" : "#ffffff";
        String text  = "dark".equals(theme) ? "#e6eef7" : "#222";
        String sub   = "dark".equals(theme) ? "#9fb3c8" : "#667085";

        String css = """
        <!doctype html><html><head><meta charset="UTF-8">
        <meta name="color-scheme" content="light dark">
        <style>
          @font-face { font-family: "NotoSansKR"; src: local("Noto Sans KR"); }
          @font-face { font-family: "Noto Color Emoji"; src: local("Noto Color Emoji"), local("Apple Color Emoji"), local("Segoe UI Emoji"); }

          html, body, .wrap, .msg, .text { letter-spacing:0 !important; word-spacing:0 !important; box-sizing:border-box; }

          body{
            margin:0; background:%s; color:%s;
            font-size:16px; line-height:1.45;
            font-family: "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
                         "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
          }

          .wrap{ width:%dpx; margin:0 auto; padding:20px; }

          .msg{
            max-width:680px; padding:12px; border-radius:14px; margin:0 0 12px;
            box-shadow:0 1px 0 rgba(0,0,0,.06);
          }
          .me{ margin-left:auto; background:%s; }
          .other{ background:%s; }

          .row{ display:flex; gap:12px; align-items:flex-start; }
          .thumb{ width:160px; height:160px; object-fit:cover; border-radius:12px; flex:0 0 auto; }

          .text{ white-space:pre-wrap; word-break:break-word; color:%s; }
          .ts{ font-size:12px; color:%s; margin-top:8px; }
        </style></head><body><div class="wrap">
        """.formatted(bg, text, width, meBg, other, text, sub); // ← 7개로 맞춤

        StringBuilder sb = new StringBuilder(css);

        for (Message m : messages) {
            boolean mine = m.getSender().getId().equals(meId);

            // ★ 여기서 공용 프리뷰 유틸 사용 (중복 제거)
            String content = escape(normalizeSpaces(
                    com.sandwich.SandWich.message.attach.util.ChatScreenshotRendererText.previewForHtml(m)
            ));

            String ts = m.getCreatedAt().atZoneSameInstant(zone).format(DTF);

            sb.append("<div class='msg ").append(mine ? "me" : "other").append("'>");

            if (m.getType() == MessageType.ATTACHMENT) {
                String dataUrl = (thumbDataUrls == null) ? null : thumbDataUrls.get(m.getId());
                if (dataUrl != null && !dataUrl.isBlank()) {
                    sb.append("<div class='row'>")
                            .append("<img class='thumb' src='").append(escape(dataUrl)).append("' alt='thumb'/>")
                            .append("<div class='text'>").append(content).append("</div>")
                            .append("</div>");
                } else {
                    sb.append("<div class='text'>").append(content).append("</div>");
                }
            } else {
                sb.append("<div class='text'>").append(content).append("</div>");
            }

            sb.append("<div class='ts'>").append(ts).append("</div>")
                    .append("</div>");
        }

        sb.append("</div></body></html>");
        return sb.toString();
    }

    private static String normalizeSpaces(String s) {
        if (s == null) return "";
        // 얇은 공백/특수 공백을 보통 공백으로 치환
        return s.replaceAll("[\\u2000-\\u200B\\u202F\\u205F\\u3000]", " ");
    }

    private static String n(String s) { return s == null ? "" : s; }

    private static String escape(String s) {
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
    }
}
