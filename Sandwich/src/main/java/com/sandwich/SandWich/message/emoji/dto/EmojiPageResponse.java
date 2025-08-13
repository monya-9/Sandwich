package com.sandwich.SandWich.message.emoji.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmojiPageResponse {
    private long total;
    private int page;
    private int size;
    private List<EmojiItem> items;
}