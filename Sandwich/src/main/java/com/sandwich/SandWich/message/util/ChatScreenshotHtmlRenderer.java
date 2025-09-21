package com.sandwich.SandWich.message.util;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.dto.MessageType;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

public class ChatScreenshotHtmlRenderer {

    // JSON 파서 (프런트가 준 토큰 JSON을 그대로 받기 위함)
    private static final ObjectMapper OM = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    // (A) 기존 시그니처 유지: 내부에서 기본 토큰 사용
    public static String buildHtml(List<Message> messages, Long meId, int width, String theme, ZoneId zone) {
        return buildHtml(messages, meId, width, theme, zone, Map.of(), DesignTokens.defaultLight());
    }

    // (B) 기존 6-인자 버전 유지: 내부에서 기본 토큰 사용
    public static String buildHtml(List<Message> messages, Long meId, int width, String theme, ZoneId zone,
                                   Map<Long, String> thumbDataUrls) {
        return buildHtml(messages, meId, width, theme, zone, thumbDataUrls, DesignTokens.defaultLight());
    }

    // (C) 프런트 토큰 JSON 바로 주입 가능한 신규 오버로드
    public static String buildHtmlWithTokensJson(List<Message> messages, Long meId, int width, String theme, ZoneId zone,
                                                 Map<Long, String> thumbDataUrls, String tokensJson) {
        DesignTokens tokens = DesignTokens.fromJson(tokensJson);
        return buildHtml(messages, meId, width, theme, zone, thumbDataUrls, tokens);
    }

    // (D) 최종 구현: 토큰을 받아 렌더링
    public static String buildHtml(List<Message> messages, Long meId, int width, String theme, ZoneId zone,
                                   Map<Long, String> thumbDataUrls, DesignTokens TOKENS) {

        DateTimeFormatter DTF = DateTimeFormatter.ofPattern(TOKENS.timestampFormat());

        String css = """
        <!doctype html><html><head><meta charset="UTF-8">
        <meta name="color-scheme" content="light">
        <style>
          :root{
            --card-bg:%s; --card-border:%s; --card-radius:%dpx; --card-padding:%dpx; --card-shadow:%s;
            --attach-bg:%s; --attach-border:%s; --attach-radius:%dpx; --attach-padding:%dpx;
          }
          body {
            margin:0;
            background:%s;
            color:%s;
            font-size:%dpx;
            line-height:%s;
            font-family:%s;
          }
          .wrap {
            width:%dpx;
            margin:0 auto;
            padding:20px;
          }
          .msg {
            max-width:680px;
            padding:%dpx %dpx;
            border-radius:%dpx;
            margin:0 0 %dpx;
            box-shadow:%s;
          }
          .me {
            margin-left:auto;
            background:%s;
          }
          .other {
            background:%s;
          }
          .row { display:flex; gap:%dpx; align-items:flex-start; }
          .thumb { width:160px; height:160px; object-fit:cover; border-radius:12px; flex:0 0 auto; }
          .text { white-space:pre-wrap; word-break:break-word; color:%s; }
          .ts { font-size:12px; color:%s; margin-top:8px; text-align:right; }

          /* 카드/첨부 스타일(토큰 반영) */
          .card { background:var(--card-bg); border:1px solid var(--card-border); border-radius:var(--card-radius); padding:var(--card-padding); box-shadow:var(--card-shadow); }
          .attach { background:var(--attach-bg); border:1px solid var(--attach-border); border-radius:var(--attach-radius); padding:var(--attach-padding); }
          .emoji { font-size:%dpx; margin:%dpx; }
        </style></head><body><div class="wrap">
        """.formatted(
                // :root 변수용
                TOKENS.card().bg(), TOKENS.card().border(), TOKENS.card().radius(), TOKENS.card().padding(), TOKENS.card().shadow(),
                TOKENS.attachment().bg(), TOKENS.attachment().border(), TOKENS.attachment().radius(), TOKENS.attachment().padding(),

                // 기본
                TOKENS.colors().bg(),
                TOKENS.colors().text(),
                TOKENS.font().size(),
                TOKENS.font().lineHeight(),
                TOKENS.font().family(),

                width,
                TOKENS.spacing().bubblePaddingY(),
                TOKENS.spacing().bubblePaddingX(),
                TOKENS.radius(),
                TOKENS.spacing().gap(),
                TOKENS.shadow(),
                TOKENS.colors().meBubble(),
                TOKENS.colors().youBubble(),
                TOKENS.spacing().gap(),
                TOKENS.colors().text(),
                TOKENS.colors().timestamp(),

                // emoji
                TOKENS.emoji().size(),
                TOKENS.emoji().margin()
        );

        StringBuilder sb = new StringBuilder(css);

        for (Message m : messages) {
            boolean mine = m.getSender().getId().equals(meId);

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
                    sb.append("<div class='text attach'>").append(content).append("</div>");
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
        return s.replaceAll("[\\u2000-\\u200B\\u202F\\u205F\\u3000]", " ");
    }

    private static String escape(String s) {
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
    }

    /* ===================== 디자인 토큰 ===================== */

    public record DesignTokens(
            Colors colors,
            Font font,
            int radius,
            String shadow,
            Spacing spacing,
            String timestampFormat,
            Emoji emoji,
            Card card,
            Attachment attachment
    ) {
        static DesignTokens defaultLight() {
            return new DesignTokens(
                    new Colors("#ffffff", "#f0fdf4", "#f3f4f6", "#1f2937", "#9ca3af", "#3b82f6"),
                    new Font("Gmarket Sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 14, "1.4"),
                    16,
                    "0 1px 3px rgba(0, 0, 0, 0.1)",
                    new Spacing(16, 12, 8),
                    "yyyy.MM.dd HH:mm",
                    new Emoji(20, 4),
                    new Card("#ffffff", "#e5e7eb", 12, 12, "0 1px 2px rgba(0, 0, 0, 0.05)"),
                    new Attachment("#f9fafb", "#d1d5db", 8, 8, 16, 12)
            );
        }

        static DesignTokens fromJson(String json) {
            try {
                // 부족한 필드는 defaultLight() 값으로 보완
                DesignTokens base = defaultLight();
                DesignTokens incoming = OM.readValue(json, DesignTokens.class);

                return new DesignTokens(
                        incoming.colors != null ? incoming.colors : base.colors,
                        incoming.font != null ? incoming.font : base.font,
                        incoming.radius != 0 ? incoming.radius : base.radius,
                        incoming.shadow != null ? incoming.shadow : base.shadow,
                        incoming.spacing != null ? incoming.spacing : base.spacing,
                        incoming.timestampFormat != null ? incoming.timestampFormat : base.timestampFormat,
                        incoming.emoji != null ? incoming.emoji : base.emoji,
                        incoming.card != null ? incoming.card : base.card,
                        incoming.attachment != null ? incoming.attachment : base.attachment
                );
            } catch (Exception e) {
                // 파싱 실패 시 기본값
                return defaultLight();
            }
        }
    }

    record Colors(String bg, String meBubble, String youBubble, String text, String timestamp, String border) {}
    record Font(String family, int size, String lineHeight) {}
    record Spacing(int bubblePaddingX, int bubblePaddingY, int gap) {}
    record Layout(String maxWidth, String minWidth, String maxWidthContainer) {}
    public record Emoji(int size, int margin) {}
    public record Card(String bg, String border, int radius, int padding, String shadow) {}
    public record Attachment(String bg, String border, int radius, int padding, int iconSize, int textSize) {}
}
