package com.sandwich.SandWich.message.emoji.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmojiItem {
    @JsonProperty("char")
    private String ch;

    private String shortcode;     // 예: "rocket"
    private String category;      // 예: "travel"
    private List<String> keywords; // 예: ["로켓","발사","우주"]
}