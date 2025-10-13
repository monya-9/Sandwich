package com.sandwich.SandWich.user.domain;


public enum UserType {
    HUMAN,   // 사람(인터랙티브 로그인 대상)
    SERVICE, // M2M(배치/봇). 대화형 로그인 금지
    SYSTEM   // 감사/시스템 태깅용(로그인 주체 X)
}