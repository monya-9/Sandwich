package com.sandwich.SandWich.auth.mfa;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)   // ★ 추가
public class OtpContext {
    private Long userId;
    private String email;
    private String provider;
    private String ip;
    private String ua;

    // 필요하면 마스킹 계산용 헬퍼
    public String getMaskedEmail() {
        if (email == null) return null;
        int at = email.indexOf('@');
        if (at <= 3) return "***" + email.substring(at);
        return email.substring(0, 3) + "****" + email.substring(at);
    }
}
