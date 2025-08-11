package com.sandwich.SandWich.proxy.controller;

import com.sandwich.SandWich.project.repository.ProjectRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/")
@RequiredArgsConstructor
public class ProjectProxyController {
    private final ProjectRepository projectRepository;

    @Value("${cloudfront.domain}")
    private String cloudFrontDomain;

    @GetMapping("/{userId:\\d+}/{projectId:\\d+}/**")
    public ResponseEntity<Void> redirectToCloudFront(
            @PathVariable Long userId,
            @PathVariable Long projectId,
            HttpServletRequest request) {

        String fullPath = request.getRequestURI();
        System.out.println("요청 URI       : " + fullPath);
        System.out.println("userId         : " + userId);
        System.out.println("projectId      : " + projectId);

        // 이미 CloudFront 도메인이 포함된 요청이면 리디렉션 X
        if (fullPath.contains(cloudFrontDomain)) {
            System.out.println("⚠️ 이미 CloudFront 도메인이 포함된 요청입니다. 무시합니다.");
            return ResponseEntity.notFound().build(); // or 직접 index.html을 반환해도 됨
        }

        String marker = "/" + userId + "/" + projectId + "/";
        int lastIndex = fullPath.lastIndexOf(marker);
        String pathAfter = "";

        if (lastIndex != -1) {
            pathAfter = fullPath.substring(lastIndex + marker.length());
        }

        System.out.println("pathAfter      : " + pathAfter);

        String redirectUrl = "https://" + cloudFrontDomain + "/" + userId + "/" + projectId;
        if (!pathAfter.isEmpty()) {
            redirectUrl += "/" + pathAfter;
        }

        System.out.println("Redirecting to : " + redirectUrl);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

}