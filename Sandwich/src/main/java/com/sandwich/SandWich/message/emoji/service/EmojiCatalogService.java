package com.sandwich.SandWich.message.emoji.service;


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sandwich.SandWich.message.emoji.dto.EmojiItem;
import com.sandwich.SandWich.message.emoji.dto.EmojiPageResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmojiCatalogService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private List<EmojiItem> all = List.of();
    private List<String> categories = List.of();

    @PostConstruct
    void load() {
        try (InputStream is = getClass().getResourceAsStream("/emoji/emoji.json")) {
            List<EmojiItem> list = objectMapper.readValue(is, new TypeReference<>() {});
            // null 안전 처리 + 정렬(카테고리, shortcode 기준)
            this.all = list.stream()
                    .filter(e -> e.getCh() != null && !e.getCh().isBlank())
                    .map(this::sanitize)
                    .sorted(Comparator.comparing((EmojiItem e) -> Optional.ofNullable(e.getCategory()).orElse(""))
                            .thenComparing(e -> Optional.ofNullable(e.getShortcode()).orElse("")))
                    .toList();

            this.categories = this.all.stream()
                    .map(EmojiItem::getCategory)
                    .filter(Objects::nonNull)
                    .distinct()
                    .sorted()
                    .toList();

        } catch (Exception e) {
            this.all = List.of();
            this.categories = List.of();
        }
    }

    private EmojiItem sanitize(EmojiItem e) {
        // keywords null → 빈 리스트
        if (e.getKeywords() == null) e.setKeywords(List.of());
        // category/shortcode 공백 정리
        if (e.getCategory() != null) e.setCategory(e.getCategory().trim());
        if (e.getShortcode() != null) e.setShortcode(e.getShortcode().trim());
        return e;
    }

    public List<String> getCategories() {
        return categories;
    }

    // NFKC 정규화 + 소문자 변환 (영/숫자/한글에 모두 안정적)
    private String norm(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFKC);
        return n.toLowerCase(Locale.ROOT).trim();
    }

    private boolean containsIgnoreCaseNorm(String haystack, String needle) {
        if (needle.isBlank()) return true;
        return norm(haystack).contains(norm(needle));
    }

    public EmojiPageResponse search(String category, String q, int page, int size) {
        String cat = norm(category);
        String query = norm(q);

        List<EmojiItem> filtered = all.stream()
                .filter(e -> cat.isBlank() || norm(e.getCategory()).equals(cat))
                .filter(e -> {
                    if (query.isBlank()) return true;
                    // shortcode/keywords/문자 자체에 대해 부분일치
                    if (containsIgnoreCaseNorm(e.getShortcode(), query)) return true;
                    if (e.getKeywords() != null && e.getKeywords().stream()
                            .anyMatch(kw -> containsIgnoreCaseNorm(kw, query))) return true;
                    return containsIgnoreCaseNorm(e.getCh(), query);
                })
                .toList();

        int total = filtered.size();

        // 페이지네이션
        int safeSize = Math.max(1, Math.min(size, 200)); // 과도한 size 방지
        int from = Math.max(0, page) * safeSize;
        if (from >= total) {
            return EmojiPageResponse.builder()
                    .total(total).page(page).size(safeSize).items(List.of()).build();
        }
        int to = Math.min(from + safeSize, total);
        List<EmojiItem> pageItems = filtered.subList(from, to);

        return EmojiPageResponse.builder()
                .total(total)
                .page(page)
                .size(safeSize)
                .items(pageItems)
                .build();
    }
}
