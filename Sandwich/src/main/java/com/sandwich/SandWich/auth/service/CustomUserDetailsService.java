package com.sandwich.SandWich.auth.service;

import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자 없음"));
        return new UserDetailsImpl(user);
    }
}
