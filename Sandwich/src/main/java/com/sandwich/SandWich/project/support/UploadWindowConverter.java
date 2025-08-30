package com.sandwich.SandWich.project.support;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class UploadWindowConverter implements Converter<String, UploadWindow> {
    @Override public UploadWindow convert(String source) {
        if (source == null) return null;
        return switch (source.toLowerCase()) {
            case "24h" -> UploadWindow.LAST_24H;
            case "7d"  -> UploadWindow.LAST_7D;
            case "1m"  -> UploadWindow.LAST_1M;
            case "3m"  -> UploadWindow.LAST_3M;
            default -> throw new IllegalArgumentException("uploadedWithin must be one of 24h|7d|1m|3m");
        };
    }
}