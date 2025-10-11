package com.sandwich.SandWich.email.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginOtpMailService {

    private final JavaMailSender sender;

    // spring.mail.username 값을 주입 받아 ‘From’으로 사용
    @Value("${spring.mail.username}")
    private String mailFrom;

    public void sendLoginOtp(String to, String code) {
        SimpleMailMessage m = new SimpleMailMessage();
        m.setFrom(mailFrom);
        m.setTo(to);
        m.setSubject("[SandWich] 로그인 인증 코드");
        m.setText("인증 코드: " + code + "\n5분 내 입력해주세요.");
        sender.send(m);
    }
}