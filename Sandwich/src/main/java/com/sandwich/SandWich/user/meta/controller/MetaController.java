package com.sandwich.SandWich.user.meta.controller;

import com.sandwich.SandWich.user.domain.InterestType;
import com.sandwich.SandWich.user.dto.InterestResponse;
import com.sandwich.SandWich.user.dto.PositionResponse;
import com.sandwich.SandWich.user.meta.service.MetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/meta")
public class MetaController {

    private final MetaService metaService;

    @GetMapping("/interests")
    public ResponseEntity<List<InterestResponse>> getInterests(@RequestParam("type") String type) {
        final InterestType interestType;
        try {
            interestType = InterestType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(metaService.getInterestsByType(interestType));
    }

    @GetMapping("/positions")
    public ResponseEntity<List<PositionResponse>> getPositions() {
        return ResponseEntity.ok(metaService.getPositions());
    }
}