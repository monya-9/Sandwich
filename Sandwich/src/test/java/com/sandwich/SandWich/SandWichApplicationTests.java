package com.sandwich.SandWich;

import com.google.auth.oauth2.JwtProvider;
import com.sandwich.SandWich.common.captcha.RecaptchaVerifier;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

@Disabled
@SpringBootTest
@ActiveProfiles("test")
class SandWichApplicationTests {
	@Test
	void contextLoads() {}
}

