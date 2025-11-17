package com.sandwich.SandWich.admin.controller;

import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public String dashboard() {
        System.out.println("💡 관리자 API 도달!");
        return "관리자 대시보드 접근 성공!";
    }
}