package com.sandwich.SandWich.message.dto;

public enum MessageType {
    GENERAL,       // 일반 텍스트
    JOB_OFFER,     // 채용 제안 (카드형)
    PROJECT_OFFER, // 프로젝트 제안 (카드형)
    EMOJI,         // 이모지
    ATTACHMENT     // 첨부파일
}