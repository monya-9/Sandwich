package com.sandwich.SandWich.project.domain;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum ContentType {
    IMAGE, TEXT, VIDEO;

    @JsonCreator
    public static ContentType from(String input) {
        return ContentType.valueOf(input.toUpperCase());
    }
}