package com.sandwich.SandWich.auth;

public interface CurrentUserProvider {
    Long currentUserId(); // 로그인 안 되면 예외
}