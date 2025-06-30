package com.sandwich.SandWich.user.controller;

import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.dto.SocialProfileRequest;
import com.sandwich.SandWich.user.dto.UserDto;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.service.UserService;
import com.sandwich.SandWich.auth.security.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final RedisTemplate<String, String> redisTemplate;

    // 마이페이지 조회
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        System.out.println("컨트롤러 도달함");
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));
        return ResponseEntity.ok(new UserDto(user));
    }

    // 회원 탈퇴
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        user.setDeleted(true);
        userRepository.save(user);
        redisTemplate.delete("refresh:userId:" + user.getId());

        return ResponseEntity.ok("회원 탈퇴 완료");
    }

    // 소셜 로그인 후 프로필 등록
    @PostMapping("/profile")
    @Transactional
    public ResponseEntity<?> saveSocialProfile(@RequestBody SocialProfileRequest req,
                                               @RequestHeader("Authorization") String token) {
        String username = jwtUtil.validateToken(token.replace("Bearer ", ""));
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        if (user.getUserPosition() != null || (user.getInterests() != null && !user.getInterests().isEmpty())) {
            return ResponseEntity.badRequest().body("이미 프로필이 설정된 유저입니다.");
        }

        userService.saveProfile(user, req);

        return ResponseEntity.ok("소셜 유저 프로필 저장 완료");
    }
}
