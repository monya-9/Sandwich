package com.sandwich.SandWich.message.util;

import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.dto.MessageType;

public final class MessagePreviewer {
    private MessagePreviewer() {}

    /** 히스토리/목록 공통 프리뷰 (삭제/카드형/이모지/일반) */
    public static String preview(Message m) {
        if (m == null) return "";
        if (m.isDeleted()) return "삭제된 메시지입니다";

        MessageType t = m.getType();
        if (t == null) return safe(m.getContent());

        return switch (t) {
            case GENERAL -> truncate(safe(m.getContent()), 80);
            case EMOJI -> safe(m.getContent()); // 이모지는 그대로
            case JOB_OFFER -> {
                String company = safe(m.getCompanyName());
                String position = safe(m.getPosition());
                if (!company.isEmpty() && !position.isEmpty()) {
                    yield "[채용 제안] " + company + " · " + position;
                }
                if (!position.isEmpty()) yield "[채용 제안] " + position;
                yield "[채용 제안]";
            }
            case PROJECT_OFFER -> {
                String title = safe(m.getTitle());
                if (!title.isEmpty()) yield "[프로젝트 제안] " + title;
                yield "[프로젝트 제안]";
            }
        };
    }

    /** 목록용 짧은 프리뷰가 필요하면 사용 (기본 80자) */
    public static String preview(Message m, int maxLen) {
        String p = preview(m);
        return truncate(p, maxLen);
    }

    private static String safe(String s) {
        return (s == null) ? "" : s;
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
