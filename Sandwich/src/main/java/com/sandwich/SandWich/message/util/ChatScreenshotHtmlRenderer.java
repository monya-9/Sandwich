package com.sandwich.SandWich.message.util;

import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.dto.MessageType;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class ChatScreenshotHtmlRenderer {
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public static String buildHtml(List<Message> messages, Long meId, int width, String theme, ZoneId zone)
    {
        String bg    = "dark".equals(theme) ? "#0b1220" : "#f5f7fa";
        String meBg  = "dark".equals(theme) ? "#244c77" : "#d2e9ff";
        String other = "dark".equals(theme) ? "#101826" : "#ffffff";
        String text  = "dark".equals(theme) ? "#e6eef7" : "#222";
        String sub   = "dark".equals(theme) ? "#9fb3c8" : "#667085";

        String css = """
        <!doctype html><html><head><meta charset="UTF-8">
        <meta name="color-scheme" content="light dark">
        <style>
          /* 폰트 선언 (시스템/설치폰트 위주 사용) */
          @font-face { font-family: "NotoSansKR"; src: local("Noto Sans KR"); }
          @font-face { font-family: "Noto Color Emoji"; src: local("Noto Color Emoji"), local("Apple Color Emoji"), local("Segoe UI Emoji"); }

          /* 전역 초기화: 자간/어간 0으로 */
          * { letter-spacing: 0; word-spacing: 0; box-sizing: border-box; }

          body{
            margin:0;
            background:%s;
            color:%s;
            font-size:16px;
            line-height:1.45;
            font-family: "Noto Sans KR", -apple-system, BlinkMacSystemFont,
                         "Segoe UI", Roboto, Helvetica, Arial,
                         "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji",
                         sans-serif;
          }

          .wrap{ width:%dpx; margin:0 auto; padding:20px; }

          .msg{
            max-width:680px;
            padding:12px;
            border-radius:14px;
            margin:0 0 12px;
            box-shadow:0 1px 0 rgba(0,0,0,.06);
          }
          .me{ margin-left:auto; background:%s; }
          .other{ background:%s; }

          /* 본문 텍스트: 자간 0, 이모지 폴백 유지 */
          .text{
            letter-spacing:0;
            white-space:pre-wrap;     /* 사용자가 넣은 개행/스페이스 유지 */
            word-break:break-word;    /* 긴 단어 줄바꿈 */
            font-family: "Noto Sans KR",
                         "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji",
                         -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }

          /* 타임스탬프만 살짝 트래킹(자간) + 탭형 숫자 */
          .ts{
            font-size:12px;
            color:%s;
            margin-top:8px;
            letter-spacing:.06em;
            font-feature-settings:"tnum" 1;
            opacity:.9;
          }
        </style></head><body><div class="wrap">
        """.formatted(bg, text, width, meBg, other, sub);

        StringBuilder sb = new StringBuilder(css);

        for (Message m : messages) {
            boolean mine = m.getSender().getId().equals(meId);
            String content = escape(getDisplayText(m));
            String ts = m.getCreatedAt()
                    .atZone(ZoneId.of("UTC"))       // 저장 기준(UTC 가정)
                    .withZoneSameInstant(zone)      // 표시용 타임존으로 변환
                    .format(DTF);
            sb.append("<div class='msg ").append(mine ? "me" : "other").append("'>")
                    .append("<div class='text'>").append(content).append("</div>")
                    .append("<div class='ts'>").append(ts).append("</div>")
                    .append("</div>");
        }
        sb.append("</div></body></html>");
        return sb.toString();
    }


    private static String getDisplayText(Message m) {
        MessageType t = m.getType();
        if (t == MessageType.GENERAL || t == MessageType.EMOJI) return n(m.getContent());
        if (t == MessageType.JOB_OFFER) {
            return "[채용 제안] " + n(m.getCompanyName()) + " / " + n(m.getPosition()) +
                    (Boolean.TRUE.equals(m.getIsNegotiable()) ? " / 연봉 협의"
                            : (m.getSalary()!=null ? " / "+m.getSalary() : "")) +
                    (m.getLocation()!=null ? " / "+m.getLocation() : "") +
                    (m.getCardDescription()!=null ? " — "+m.getCardDescription() : "");
        }
        if (t == MessageType.PROJECT_OFFER) {
            return "[프로젝트 제안] " + n(m.getTitle()) + " / 예산:" + n(m.getBudget()) +
                    (Boolean.TRUE.equals(m.getIsNegotiable()) ? "(협의)" : "") +
                    (m.getContact()!=null ? " / "+m.getContact() : "") +
                    (m.getCardDescription()!=null ? " — "+m.getCardDescription() : "");
        }
        return "";
    }
    private static String n(String s){ return s==null? "": s; }
    private static String escape(String s){
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;");
    }
}
