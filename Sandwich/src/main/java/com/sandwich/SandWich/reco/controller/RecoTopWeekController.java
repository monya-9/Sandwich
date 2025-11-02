package com.sandwich.SandWich.reco.controller;

import com.sandwich.SandWich.reco.service.RecoTopWeekService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reco")
public class RecoTopWeekController {

    private final RecoTopWeekService service;

    @GetMapping("/top/week")
    public RecoTopWeekService.Response get() {
        return service.get();
    }
}