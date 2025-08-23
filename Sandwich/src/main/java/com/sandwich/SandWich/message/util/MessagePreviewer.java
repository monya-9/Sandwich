package com.sandwich.SandWich.message.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.message.domain.Message;

public final class MessagePreviewer {
    private static final ObjectMapper M = new ObjectMapper();
    private MessagePreviewer() {}

    public static String preview(Message m) {
        if (m.isDeleted()) {
            return "삭제된 메시지입니다";
        }
        return switch (m.getType()) {
            case GENERAL -> cut(nullToEmpty(m.getContent()), 80);
            case EMOJI -> cut(nullToEmpty(m.getContent()), 80);
            case JOB_OFFER -> "[채용 제안] " + nullToEmpty(m.getPosition());
            case PROJECT_OFFER -> "[프로젝트 제안] " + nullToEmpty(m.getTitle());
            case ATTACHMENT -> {
                String name = extract(m.getPayload(), "name");
                yield cut("[첨부파일] " + (name == null ? "" : name), 80);
            }
        };
    }


    private static String cut(String s, int n) {
        if (s == null) return "";
        return s.length() <= n ? s : s.substring(0, n) + "...";
    }

    private static String nullToEmpty(String s) { return s == null ? "" : s; }

    private static String extract(String json, String key) {
        if (json == null) return null;
        try {
            JsonNode n = M.readTree(json);
            JsonNode v = n.get(key);
            return v == null ? null : v.asText();
        } catch (Exception e) {
            return null;
        }
    }
}
