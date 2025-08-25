package com.sandwich.SandWich.message.attach.util;

import com.sandwich.SandWich.message.domain.Message;

import java.awt.image.BufferedImage;

@FunctionalInterface
public interface ThumbnailResolver {
    /**
     * 메시지(첨부 타입)용 썸네일 이미지를 반환. 없으면 null.
     */
    BufferedImage resolveFor(Message m);
}