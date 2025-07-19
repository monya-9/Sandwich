package com.sandwich.SandWich.user;

import com.sandwich.SandWich.global.exception.exceptiontype.UserNotFoundException;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void 이메일로_회원조회_성공() {
        // given
        String email = "user@example.com";
        User user = User.builder()
                .id(1L)
                .email(email)
                .username("테스트유저")
                .isDeleted(false)
                .build();

        when(userRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(user));

        // when
        User result = userService.findByEmail(email);

        // then
        assertEquals(email, result.getEmail());
        assertEquals("테스트유저", result.getUsername());
    }

    @Test
    void 이메일로_회원조회_실패시_예외발생() {
        // given
        String email = "notfound@example.com";
        when(userRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.empty());

        // expect
        assertThrows(UserNotFoundException.class, () -> {
            userService.findByEmail(email);
        });
    }

    @Test
    void 탈퇴회원_조회시_예외발생() {
        // given
        String email = "withdrawn@example.com";
        User withdrawn = User.builder()
                .id(2L)
                .email(email)
                .isDeleted(true)
                .build();

        when(userRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(withdrawn));

        // expect
        assertThrows(UserNotFoundException.class, () -> {
            userService.findByEmail(email);
        });
    }
}
