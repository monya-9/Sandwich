package com.sandwich.SandWich;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import jakarta.annotation.PostConstruct;
import org.springframework.security.core.context.SecurityContextHolder;

@SpringBootApplication(scanBasePackages = "com.sandwich.SandWich")
public class SandWichApplication {

	public static void main(String[] args) {
		SpringApplication.run(SandWichApplication.class, args);
	}

	@PostConstruct
	public void init() {
		SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);
	}

}
