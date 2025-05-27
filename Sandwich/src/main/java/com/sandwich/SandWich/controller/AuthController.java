package com.sandwich.SandWich.controller;

import com.sandwich.SandWich.domain.User;
import com.sandwich.SandWich.dto.SignupRequest;
import com.sandwich.SandWich.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest req) {
        // Optional: 이메일 중복 체크는 생략 가능
        User user = new User();
        user.setEmail(req.getEmail());
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword())); // 비밀번호 암호화
        userRepository.save(user);

        return ResponseEntity.ok("가입 완료");
    }
}