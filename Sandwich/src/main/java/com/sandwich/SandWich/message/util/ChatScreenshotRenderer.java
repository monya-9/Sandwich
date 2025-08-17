package com.sandwich.SandWich.message.util;

import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.dto.MessageType;
import java.text.AttributedString;
import java.text.AttributedCharacterIterator;
import java.awt.font.*;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

public class ChatScreenshotRenderer {

    private static Font loadKoreanFont(float size) {
        try (var is = ChatScreenshotRenderer.class.getResourceAsStream("/fonts/NotoSansKR-Regular.ttf")) {
            Font base = Font.createFont(Font.TRUETYPE_FONT, is);
            return base.deriveFont(size);
        } catch (Exception e) {
            // 폰트가 없으면 시스템 SansSerif로 폴백
            return new Font("SansSerif", Font.PLAIN, (int) size);
        }
    }

    private static Font loadEmojiFont(float size) {
        try (var is = ChatScreenshotRenderer.class.getResourceAsStream("/fonts/OpenMoji-black-glyf.ttf")) {
            Font base = Font.createFont(Font.TRUETYPE_FONT, is);
            return base.deriveFont(size);
        } catch (Exception e) {
            return new Font("SansSerif", Font.PLAIN, (int) size);
        }
    }


    private static boolean isEmojiCodePoint(int cp) {
        // BMP 범위 일부 (해/구름/별 등 기호, 딩뱃)
        if ((cp >= 0x2600 && cp <= 0x26FF) || (cp >= 0x2700 && cp <= 0x27BF)) return true;

        // 기본 이모지 평면들
        if ((cp >= 0x1F300 && cp <= 0x1F5FF)) return true; // Misc Symbols & Pictographs
        if ((cp >= 0x1F600 && cp <= 0x1F64F)) return true; // Emoticons
        if ((cp >= 0x1F680 && cp <= 0x1F6FF)) return true; // Transport & Map
        if ((cp >= 0x1F900 && cp <= 0x1F9FF)) return true; // Supplemental Symbols & Pictographs
        if ((cp >= 0x1FA70 && cp <= 0x1FAFF)) return true; // Symbols & Pictographs Ext-A

        // 국기(Regional Indicators)
        if (cp >= 0x1F1E6 && cp <= 0x1F1FF) return true;

        // 성별 기호 등 (이모지 조합에 자주 쓰임)
        if (cp == 0x2640 || cp == 0x2642) return true;

        return false;
    }

    private static boolean isEmojiJoinerOrModifier(int cp) {
        // ZWJ
        if (cp == 0x200D) return true;
        // Variation Selector-16 (emoji presentation)
        if (cp == 0xFE0F) return true;
        // Fitzpatrick modifiers
        if (cp >= 0x1F3FB && cp <= 0x1F3FF) return true;
        return false;
    }

    /** 텍스트(한글 폰트)와 이모지(이모지 폰트) 구간을 코드포인트 기준으로 분할해 AttributedString 생성 */
    private static AttributedCharacterIterator buildAttrRuns(String text, Font textFont, Font emojiFont) {
        if (text == null) text = "";

        AttributedString as = new AttributedString(text);
        int len = text.length();

        // 코드포인트 단위로 스캔하면서, "이모지 런"과 "텍스트 런"을 나눔
        int charIndex = 0;
        boolean currentEmoji = false;
        int runStart = 0;

        while (charIndex < len) {
            final int cp = text.codePointAt(charIndex);
            final boolean emojiish = isEmojiCodePoint(cp) || isEmojiJoinerOrModifier(cp);

            // 상태 전환 시 기존 런에 폰트 적용
            if (charIndex == 0) {
                currentEmoji = emojiish;
            } else if (emojiish != currentEmoji) {
                as.addAttribute(java.awt.font.TextAttribute.FONT,
                        currentEmoji ? emojiFont : textFont, runStart, charIndex);
                runStart = charIndex;
                currentEmoji = emojiish;
            }
            charIndex += Character.charCount(cp);
        }

        // 마지막 런 적용
        as.addAttribute(java.awt.font.TextAttribute.FONT,
                currentEmoji ? emojiFont : textFont, runStart, len);

        return as.getIterator();
    }

    private static void enableQuality(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
    }

    // 간단한 말풍선 렌더링 (텍스트만, 첨부/이모지는 content로)
    public static byte[] renderPng(List<Message> messages, Long meId) throws Exception {
        final int width = 900;          // 전체 이미지 가로
        final int padding = 20;         // 바깥 여백
        final int bubblePadding = 12;   // 말풍선 내부 패딩
        final int gap = 12;             // 말풍선 간격
        final int timestampArea = 16;   // 타임스탬프 높이 여유
        final int rightGutter = 200;    // 오른쪽 정렬 여유
        final int contentWidth = width - padding * 2 - rightGutter;

        Font font  = loadKoreanFont(16f);
        Font emoji = loadEmojiFont(16f);           // <- NotoColorEmoji 사용
        Font small = loadKoreanFont(12f);
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        // 1) 총 높이 계산(프리패스)
        BufferedImage tmpImg = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        Graphics2D tg = tmpImg.createGraphics();
        enableQuality(tg);

        int totalHeight = padding;
        List<Integer> precomputedHeights = new ArrayList<>(messages.size());
        List<Integer> precomputedMaxLineWidths = new ArrayList<>(messages.size());

        for (Message m : messages) {
            String text = getDisplayText(m);
            AttributedCharacterIterator it = buildAttrRuns(text, font, emoji);
            List<TextLayout> lines = layoutLines(tg, it, contentWidth - bubblePadding * 2);

            int textHeight = linesHeight(lines, 2);
            int maxLineW   = maxLineWidth(lines);

            int bubbleH = textHeight + bubblePadding * 2 + timestampArea;
            precomputedHeights.add(bubbleH);
            precomputedMaxLineWidths.add(Math.min(contentWidth, maxLineW + bubblePadding * 2));

            totalHeight += bubbleH + gap;
        }
        tg.dispose();
        totalHeight += padding;

        // 2) 실제 그리기
        BufferedImage img = new BufferedImage(width, Math.max(totalHeight, 200), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        enableQuality(g);

        // 배경
        g.setColor(new Color(245, 247, 250));
        g.fillRect(0, 0, width, totalHeight);

        int y = padding;
        for (int i = 0; i < messages.size(); i++) {
            Message m = messages.get(i);
            boolean mine = m.getSender().getId().equals(meId);
            String preview = getDisplayText(m);

            AttributedCharacterIterator it = buildAttrRuns(preview, font, emoji);
            List<TextLayout> lines = layoutLines(g, it, contentWidth - bubblePadding * 2);

            int bubbleW = precomputedMaxLineWidths.get(i);
            int bubbleH = precomputedHeights.get(i);
            int x = mine ? (width - padding - bubbleW) : padding;

            // 말풍선
            g.setColor(mine ? new Color(210, 233, 255) : Color.WHITE);
            g.fillRoundRect(x, y, bubbleW, bubbleH, 16, 16);
            g.setColor(new Color(220, 226, 235));
            g.drawRoundRect(x, y, bubbleW, bubbleH, 16, 16);

            // 텍스트
            g.setColor(Color.DARK_GRAY);
            drawLayouts(g, lines, x + bubblePadding, y + bubblePadding, 2);

            // 타임스탬프
            g.setFont(small);
            g.setColor(new Color(100, 110, 120));
            String ts = dtf.format(m.getCreatedAt());
            g.drawString(ts, x + bubblePadding, y + bubbleH - 6);
            g.setFont(font);

            y += bubbleH + gap;
        }
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }


    private static List<TextLayout> layoutLines(Graphics2D g, AttributedCharacterIterator it, int maxWidth) {
        FontRenderContext frc = g.getFontRenderContext();
        LineBreakMeasurer measurer = new LineBreakMeasurer(it, frc);
        List<TextLayout> lines = new ArrayList<>();
        int end = it.getEndIndex();
        while (measurer.getPosition() < end) {
            lines.add(measurer.nextLayout(maxWidth));
        }
        return lines;
    }

    private static int linesHeight(List<TextLayout> lines, int lineGap) {
        int h = 0;
        for (TextLayout tl : lines) {
            h += tl.getAscent() + tl.getDescent() + tl.getLeading() + lineGap;
        }
        return h;
    }


    private static int maxLineWidth(List<TextLayout> lines) {
        int w = 0;
        for (TextLayout tl : lines) {
            w = Math.max(w, (int) tl.getAdvance());
        }
        return w;
    }


    private static void drawLayouts(Graphics2D g, List<TextLayout> lines, int x, int y, int lineGap) {
        int curY = y;
        for (TextLayout tl : lines) {
            curY += tl.getAscent();
            tl.draw(g, x, curY);
            curY += tl.getDescent() + tl.getLeading() + lineGap;
        }
    }


    private static String getDisplayText(Message m) {
        MessageType t = m.getType();
        if (t == MessageType.GENERAL || t == MessageType.EMOJI) {
            return m.getContent() == null ? "" : m.getContent();
        }
        if (t == MessageType.JOB_OFFER) {
            return "[채용 제안] " +
                    ns(m.getCompanyName()) + " / " +
                    ns(m.getPosition()) +
                    (Boolean.TRUE.equals(m.getIsNegotiable()) ? " / 연봉 협의"
                            : (m.getSalary() != null ? " / " + m.getSalary() : "")) +
                    (m.getLocation() != null ? " / " + m.getLocation() : "") +
                    (m.getCardDescription() != null ? " — " + m.getCardDescription() : "");
        }
        if (t == MessageType.PROJECT_OFFER) {
            return "[프로젝트 제안] " +
                    ns(m.getTitle()) + " / 예산:" + ns(m.getBudget()) +
                    (Boolean.TRUE.equals(m.getIsNegotiable()) ? "(협의)" : "") +
                    (m.getContact() != null ? " / " + m.getContact() : "") +
                    (m.getCardDescription() != null ? " — " + m.getCardDescription() : "");
        }
        return "";
    }

    private static String ns(String s) { return s == null ? "" : s; }

}
