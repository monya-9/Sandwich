package com.sandwich.SandWich.chat.dto;

import lombok.Data;

@Data
public class UpdateMessagePreferenceRequest {
    private Boolean allowProjectOffer; // null이면 변경 안 함
    private Boolean allowJobOffer;
}