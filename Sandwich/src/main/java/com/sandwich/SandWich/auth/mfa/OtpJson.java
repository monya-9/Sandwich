package com.sandwich.SandWich.auth.mfa;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class OtpJson {
    private static final ObjectMapper om = new ObjectMapper();

    public static String toJson(OtpContext ctx) {
        try {
            return om.writeValueAsString(ctx);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("OTP context 직렬화 실패", e);
        }
    }

    public static OtpContext fromJson(String json) {
        try {
            return om.readValue(json, OtpContext.class);
        } catch (Exception e) {
            throw new RuntimeException("OTP context 역직렬화 실패", e);
        }
    }
}
