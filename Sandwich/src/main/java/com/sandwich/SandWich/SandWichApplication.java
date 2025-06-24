package com.sandwich.SandWich;


import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication(scanBasePackages = "com.sandwich.SandWich")
public class SandWichApplication {

	public static void main(String[] args) {
		SpringApplication.run(SandWichApplication.class, args);
	}


	@Bean
	public CommandLineRunner checkBeans(ApplicationContext ctx) {
		return args -> {
			System.out.println("등록된 컨트롤러 목록:");
			String[] controllers = ctx.getBeanNamesForAnnotation(RestController.class);
			for (String name : controllers) {
				System.out.println(" - " + name);
			}
		};
	}

}
