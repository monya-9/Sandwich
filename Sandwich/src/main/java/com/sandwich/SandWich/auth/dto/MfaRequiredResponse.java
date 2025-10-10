package com.sandwich.SandWich.auth.dto;

import lombok.AllArgsConstructor; import lombok.Getter;

@Getter @AllArgsConstructor
public class MfaRequiredResponse {
    private final String status;      // "MFA_REQUIRED"
    private final String pendingId;
    private final String maskedEmail;
}