package com.sandwich.SandWich.common.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordEncoderTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String rawPassword = "admin123!"; // 여기 원하는 비번 입력
        String encoded = encoder.encode(rawPassword);

        System.out.println("BCrypt 암호화 결과:");
        System.out.println(encoded);
    }
}