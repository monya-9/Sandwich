package com.sandwich.SandWich.message.util;

import com.sandwich.SandWich.message.attach.util.ThumbnailResolver;
import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.dto.MessageType;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.awt.*;
import java.awt.font.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.text.AttributedCharacterIterator;
import java.text.AttributedString;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import javax.imageio.ImageIO;

public class ChatScreenshotRenderer {

    private static final ObjectMapper M = new ObjectMapper();

    // -------------------- Font Loader --------------------
    private static java.awt.Font loadKoreanFont(float size) {
        try (var is = ChatScreenshotRenderer.class.getResourceAsStream("/fonts/NotoSansKR-Regular.ttf")) {
            java.awt.Font base = java.awt.Font.createFont(java.awt.Font.TRUETYPE_FONT, is);
            return base.deriveFont(size);
        } catch (Exception e) {
            return new java.awt.Font("SansSerif", java.awt.Font.PLAIN, (int) size);
        }
    }
    private static java.awt.Font loadEmojiFont(float size) {
        try (var is = ChatScreenshotRenderer.class.getResourceAsStream("/fonts/OpenMoji-black-glyf.ttf")) {
            java.awt.Font base = java.awt.Font.createFont(java.awt.Font.TRUETYPE_FONT, is);
            return base.deriveFont(size);
        } catch (Exception e) {
            return new java.awt.Font("SansSerif", java.awt.Font.PLAIN, (int) size);
        }
    }

    // -------------------- Emoji Helpers --------------------
    private static boolean isEmojiCodePoint(int cp) {
        if ((cp >= 0x2600 && cp <= 0x26FF) || (cp >= 0x2700 && cp <= 0x27BF)) return true;
        if ((cp >= 0x1F300 && cp <= 0x1F5FF)) return true;
        if ((cp >= 0x1F600 && cp <= 0x1F64F)) return true;
        if ((cp >= 0x1F680 && cp <= 0x1F6FF)) return true;
        if ((cp >= 0x1F900 && cp <= 0x1F9FF)) return true;
        if ((cp >= 0x1FA70 && cp <= 0x1FAFF)) return true;
        if (cp >= 0x1F1E6 && cp <= 0x1F1FF) return true;
        if (cp == 0x2640 || cp == 0x2642) return true;
        return false;
    }
    private static boolean isEmojiJoinerOrModifier(int cp) {
        return cp == 0x200D || cp == 0xFE0F || (cp >= 0x1F3FB && cp <= 0x1F3FF);
    }

    /** 텍스트/이모지 구간별 폰트 적용 */
    private static AttributedCharacterIterator buildAttrRuns(String text, java.awt.Font textFont, java.awt.Font emojiFont) {
        if (text == null) text = "";
        AttributedString as = new AttributedString(text);
        int len = text.length();
        int charIndex = 0;
        boolean currentEmoji = false;
        int runStart = 0;
        while (charIndex < len) {
            final int cp = text.codePointAt(charIndex);
            final boolean emojiish = isEmojiCodePoint(cp) || isEmojiJoinerOrModifier(cp);
            if (charIndex == 0) {
                currentEmoji = emojiish;
            } else if (emojiish != currentEmoji) {
                as.addAttribute(TextAttribute.FONT, currentEmoji ? emojiFont : textFont, runStart, charIndex);
                runStart = charIndex;
                currentEmoji = emojiish;
            }
            charIndex += Character.charCount(cp);
        }
        as.addAttribute(TextAttribute.FONT, currentEmoji ? emojiFont : textFont, runStart, len);
        return as.getIterator();
    }

    // -------------------- Rendering Utils --------------------
    private static void enableQuality(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
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

    // -------------------- Color Parser --------------------
    private static Color parseColor(String s) {
        if (s == null) return Color.WHITE;
        s = s.trim().toLowerCase();
        try {
            if (s.startsWith("#")) {
                int r = Integer.valueOf(s.substring(1, 3), 16);
                int g = Integer.valueOf(s.substring(3, 5), 16);
                int b = Integer.valueOf(s.substring(5, 7), 16);
                return new Color(r, g, b);
            }
            if (s.startsWith("rgba")) {
                String[] p = s.substring(s.indexOf('(') + 1, s.indexOf(')')).split(",");
                int r = Integer.parseInt(p[0].trim());
                int g = Integer.parseInt(p[1].trim());
                int b = Integer.parseInt(p[2].trim());
                float a = Float.parseFloat(p[3].trim());
                return new Color(r, g, b, Math.round(a * 255));
            }
            if (s.startsWith("rgb")) {
                String[] p = s.substring(s.indexOf('(') + 1, s.indexOf(')')).split(",");
                int r = Integer.parseInt(p[0].trim());
                int g = Integer.parseInt(p[1].trim());
                int b = Integer.parseInt(p[2].trim());
                return new Color(r, g, b);
            }
        } catch (Exception ignore) {}
        return Color.WHITE;
    }

    // -------------------- Public API --------------------
    public static byte[] renderPngWithTokensJson(List<Message> messages, Long meId,
                                                 ThumbnailResolver thumbResolver, String tokensJson) throws Exception {
        return renderPng(messages, meId, thumbResolver, DesignTokens.fromJson(tokensJson));
    }
    public static byte[] renderPng(List<Message> messages, Long meId) throws Exception {
        return renderPng(messages, meId, null, DesignTokens.defaults());
    }
    public static byte[] renderPng(List<Message> messages, Long meId, ThumbnailResolver thumbResolver) throws Exception {
        return renderPng(messages, meId, thumbResolver, DesignTokens.defaults());
    }

    // -------------------- Core Render --------------------
    private static byte[] renderPng(List<Message> messages, Long meId,
                                    ThumbnailResolver thumbResolver, DesignTokens t) throws Exception {
        final int width = 900;
        final int padding = 20;
        final int bubblePaddingX = t.spacing.bubblePaddingX;
        final int bubblePaddingY = t.spacing.bubblePaddingY;
        final int gap = t.spacing.gap;
        final int radius = t.radius;
        final int timestampArea = 18;
        final int rightGutter = 200;
        final int contentWidth = width - padding * 2 - rightGutter;

        // AWT 폰트는 java.awt.Font로 명시
        java.awt.Font font  = loadKoreanFont((float) t.font.size);
        java.awt.Font emoji = loadEmojiFont((float) t.font.size);
        java.awt.Font small = loadKoreanFont(Math.max(11, t.font.size - 2));
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern(t.timestampFormat);

        // --- Pre-pass ---
        BufferedImage tmpImg = new BufferedImage(1, 1, BufferedImage.TYPE_INT_ARGB);
        Graphics2D tg = tmpImg.createGraphics();
        enableQuality(tg);

        final int thumbW = 160, thumbH = 160;
        List<Integer> preHeights = new ArrayList<>(messages.size());
        List<Integer> preWidths  = new ArrayList<>(messages.size());
        List<Boolean> hasThumb   = new ArrayList<>(messages.size());

        int totalHeight = padding;
        for (Message m : messages) {
            String text = getDisplayText(m);
            var it = buildAttrRuns(text, font, emoji);
            List<TextLayout> lines = layoutLines(tg, it, contentWidth - bubblePaddingX * 2);

            int textHeight = linesHeight(lines, 2);
            int maxLineW   = maxLineWidth(lines);

            boolean showThumb = false;
            if (m.getType() == MessageType.ATTACHMENT && thumbResolver != null) {
                try { showThumb = (thumbResolver.resolveFor(m) != null); } catch (Exception ignore) {}
            }
            hasThumb.add(showThumb);

            int bubbleH = textHeight + bubblePaddingY * 2 + timestampArea;
            int bubbleW = Math.min(contentWidth, maxLineW + bubblePaddingX * 2);

            if (showThumb) {
                bubbleH = Math.max(bubbleH, thumbH + bubblePaddingY * 2 + timestampArea);
                bubbleW = Math.max(bubbleW, thumbW + bubblePaddingX * 2);
            }

            preHeights.add(bubbleH);
            preWidths.add(bubbleW);
            totalHeight += bubbleH + gap;
        }
        tg.dispose();
        totalHeight += padding;

        // --- Draw ---
        BufferedImage img = new BufferedImage(width, Math.max(totalHeight, 200), BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        enableQuality(g);

        g.setColor(parseColor(t.colors.bg));
        g.fillRect(0, 0, width, totalHeight);

        Color meBg = parseColor(t.colors.meBubble);
        Color otherBg = parseColor(t.colors.youBubble);
        Color border = parseColor(t.colors.border);
        Color textColor = parseColor(t.colors.text);
        Color tsColor = parseColor(t.colors.timestamp);

        int y = padding;
        for (int i = 0; i < messages.size(); i++) {
            Message m = messages.get(i);
            boolean mine = m.getSender().getId().equals(meId);
            String preview = getDisplayText(m);

            var it = buildAttrRuns(preview, font, emoji);
            List<TextLayout> lines = layoutLines(g, it, contentWidth - bubblePaddingX * 2);

            int bubbleW = preWidths.get(i);
            int bubbleH = preHeights.get(i);
            int x = mine ? (width - padding - bubbleW) : padding;

            // Bubble
            g.setColor(mine ? meBg : otherBg);
            g.fillRoundRect(x, y, bubbleW, bubbleH, radius, radius);
            g.setColor(border);
            g.drawRoundRect(x, y, bubbleW, bubbleH, radius, radius);

            int contentX = x + bubblePaddingX;
            int contentY = y + bubblePaddingY;

            // 텍스트
            g.setColor(textColor);
            drawLayouts(g, lines, contentX, contentY, 2);

            // 타임스탬프
            g.setFont(small);
            g.setColor(tsColor);
            String ts = dtf.format(m.getCreatedAt());
            g.drawString(ts, x + bubblePaddingX, y + bubbleH - 6);
            g.setFont(font);

            y += bubbleH + gap;
        }
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    // -------------------- Message Text --------------------
    private static String getDisplayText(Message m) {
        MessageType t = m.getType();
        if (t == MessageType.GENERAL || t == MessageType.EMOJI) {
            return m.getContent() == null ? "" : m.getContent();
        }
        if (t == MessageType.ATTACHMENT) {
            String name = jval(m.getPayload(), "name");
            return "[첨부파일] " + (name != null ? name : "");
        }
        return "";
    }
    private static String jval(String json, String key) {
        if (json == null) return null;
        try {
            JsonNode n = M.readTree(json);
            JsonNode v = n.get(key);
            return v == null ? null : v.asText();
        } catch (Exception e) { return null; }
    }

    // -------------------- Tokens (Font 이름 충돌 방지: UiFont 사용) --------------------
    static final class DesignTokens {
        Colors colors; UiFont font; int radius; Spacing spacing; String timestampFormat;
        static DesignTokens defaults() {
            DesignTokens t = new DesignTokens();
            t.colors = new Colors("#ffffff", "#f0fdf4", "#f3f4f6", "#1f2937", "#9ca3af", "#e5e7eb");
            t.font = new UiFont("'Gmarket Sans', sans-serif", 14, 1.4);
            t.radius = 16;
            t.spacing = new Spacing(16, 12, 8, 12);
            t.timestampFormat = "yyyy.MM.dd HH:mm";
            return t;
        }
        static DesignTokens fromJson(String json) {
            try {
                ObjectMapper om = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                DesignTokens in = om.readValue(json, DesignTokens.class);
                DesignTokens base = defaults();
                if (in.colors == null) in.colors = base.colors;
                if (in.font == null) in.font = base.font;
                if (in.radius == 0) in.radius = base.radius;
                if (in.spacing == null) in.spacing = base.spacing;
                if (in.timestampFormat == null) in.timestampFormat = base.timestampFormat;
                return in;
            } catch (Exception e) { return defaults(); }
        }
    }
    static final class Colors {
        public String bg, meBubble, youBubble, text, timestamp, border;
        public Colors() {}
        public Colors(String bg, String meBubble, String youBubble, String text, String timestamp, String border) {
            this.bg = bg; this.meBubble = meBubble; this.youBubble = youBubble;
            this.text = text; this.timestamp = timestamp; this.border = border;
        }
    }
    static final class UiFont {   // ← 이름 변경
        public String family; public int size; public double lineHeight;
        public UiFont() {}
        public UiFont(String family, int size, double lineHeight) {
            this.family = family; this.size = size; this.lineHeight = lineHeight;
        }
    }
    static final class Spacing {
        public int bubblePaddingX, bubblePaddingY, gap, messageMargin;
        public Spacing() {}
        public Spacing(int x, int y, int gap, int msg) {
            this.bubblePaddingX = x; this.bubblePaddingY = y; this.gap = gap; this.messageMargin = msg;
        }
    }
}
