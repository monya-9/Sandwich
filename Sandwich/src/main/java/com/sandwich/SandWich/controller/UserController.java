package com.sandwich.SandWich.controller;

import com.sandwich.SandWich.domain.User;
import com.sandwich.SandWich.dto.UserDto;
import com.sandwich.SandWich.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        System.out.println("컨트롤러 도달함");
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        return ResponseEntity.ok(new UserDto(user));
    }
}
