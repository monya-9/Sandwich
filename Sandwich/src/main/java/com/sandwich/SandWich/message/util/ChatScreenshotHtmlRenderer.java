package com.sandwich.SandWich.message.util;

import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.dto.MessageType;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class ChatScreenshotHtmlRenderer {
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public static String buildHtml(List<Message> messages, Long meId, int width, String theme, ZoneId zone) {
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

          /* 전역 자간/어간 0 강제 */
          html, body, .wrap, .msg, .text {
            letter-spacing: 0 !important;
            word-spacing: 0 !important;
            box-sizing: border-box;
          }

          body{
            margin:0; background:%s; color:%s;
            font-size:16px; line-height:1.45;
            font-family: "Noto Sans KR", -apple-system, BlinkMacSystemFont,
                         "Segoe UI", Roboto, Helvetica, Arial,
                         "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji",
                         sans-serif;
          }

          .wrap{ width:%dpx; margin:0 auto; padding:20px; }

          .msg{
            max-width:680px; padding:12px; border-radius:14px; margin:0 0 12px;
            box-shadow:0 1px 0 rgba(0,0,0,.06);
          }
          .me{ margin-left:auto; background:%s; }
          .other{ background:%s; }

          .text{
            white-space: pre-wrap;           /* 유저 공백/줄바꿈 유지 */
            word-break: break-word;
            /* 이모지는 폴백으로만 사용되도록 뒤쪽에 둠 */
            font-family: "Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo",
                         Arial, Helvetica, sans-serif,
                         "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji";
          }

          .ts{
            font-size:12px; color:%s; margin-top:8px;
            letter-spacing: 0;               /* 먼저 0으로 확인 */
            /* 필요하면 .04em 정도로 아주 살짝만 늘리세요 */
          }
        </style></head><body><div class="wrap">
        """.formatted(bg, text, width, meBg, other, sub);

        StringBuilder sb = new StringBuilder(css);

        for (Message m : messages) {
            boolean mine = m.getSender().getId().equals(meId);
            // 숨은 공백 정규화 -> escape 한 번만!
            String content = escape(normalizeSpaces(getDisplayText(m)));

            String ts = m.getCreatedAt()
                    .atZoneSameInstant(zone)
                    .format(DTF);

            sb.append("<div class='msg ").append(mine ? "me" : "other").append("'>")
                    .append("<div class='text'>").append(content).append("</div>")
                    .append("<div class='ts'>").append(ts).append("</div>")
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

    private static String getDisplayText(Message m) {
        MessageType t = m.getType();
        if (t == MessageType.GENERAL || t == MessageType.EMOJI) return n(m.getContent());
        if (t == MessageType.JOB_OFFER) {
            return "[채용 제안] " + n(m.getCompanyName()) + " / " + n(m.getPosition()) +
                    (Boolean.TRUE.equals(m.getIsNegotiable()) ? " / 연봉 협의"
                            : (m.getSalary() != null ? " / " + m.getSalary() : "")) +
                    (m.getLocation() != null ? " / " + m.getLocation() : "") +
                    (m.getCardDescription() != null ? " — " + m.getCardDescription() : "");
        }
        if (t == MessageType.PROJECT_OFFER) {
            return "[프로젝트 제안] " + n(m.getTitle()) + " / 예산:" + n(m.getBudget()) +
                    (Boolean.TRUE.equals(m.getIsNegotiable()) ? "(협의)" : "") +
                    (m.getContact() != null ? " / " + m.getContact() : "") +
                    (m.getCardDescription() != null ? " — " + m.getCardDescription() : "");
        }
        return "";
    }

    private static String n(String s) { return s == null ? "" : s; }

    private static String escape(String s) {
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
    }
}
