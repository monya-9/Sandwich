package com.sandwich.SandWich.admin.controller;

import com.sandwich.SandWich.auth.device.DeviceTrustService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/devices")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDeviceController {

    private final DeviceTrustService trust;

    @PostMapping("/revoke-all/{userId}")
    public Map<String, Object> revokeAllForUser(@PathVariable Long userId) {
        int n = trust.revokeAll(userId);
        return Map.of("revoked", n);
    }
}