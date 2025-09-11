package com.sandwich.SandWich.notification.fanout;

public interface OnlineGate {
    boolean isOnline(Long userId); // 세션 존재 여부
    boolean isSubscribed(Long userId, String dest); // 특정 토픽 구독 여부
}