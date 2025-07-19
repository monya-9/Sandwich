package com.sandwich.SandWich.user.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.global.exception.exceptiontype.UserNotFoundException;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.dto.UserProfileRequest;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.service.UserService;
import com.sandwich.SandWich.auth.security.JwtUtil;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    @Transactional
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        System.out.println("getName() = " + authentication.getName());
        String email = authentication.getName();
        User user = userRepository.findByEmailWithDetails(email)
                .orElseThrow(UserNotFoundException::new);

        return ResponseEntity.ok(userService.getMe(user));
    }

    // 회원 탈퇴
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        userService.deleteMe(userDetails.getUser());
        redisTemplate.delete("refresh:userId:" + userDetails.getUser().getId());

        return ResponseEntity.ok("회원 탈퇴 완료");
    }


    @PutMapping("/profile")
    @Transactional
    public ResponseEntity<?> updateOrCreateProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody @Valid UserProfileRequest req
    ) {
        User user = userDetails.getUser();

        userService.upsertUserProfile(user, req);
        return ResponseEntity.ok("프로필 설정 완료");
    }
}
