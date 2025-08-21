package com.sandwich.SandWich.message.room.controller;

import com.sandwich.SandWich.auth.security.UserDetailsImpl;
import com.sandwich.SandWich.message.dto.MessagePageResponse;
import com.sandwich.SandWich.message.room.dto.RoomListItemResponse;
import com.sandwich.SandWich.message.room.service.RoomHistoryService;
import com.sandwich.SandWich.message.room.service.RoomQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomQueryService roomQueryService;
    private final RoomHistoryService roomHistoryService;

    @GetMapping
    public Page<RoomListItemResponse> getMyRooms(
            @AuthenticationPrincipal UserDetailsImpl principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return roomQueryService.getMyRooms(principal.getUser(), pageable);
    }

    @GetMapping("/{roomId}")
    public MessagePageResponse getRoomHistory(
            @AuthenticationPrincipal UserDetailsImpl me,
            @PathVariable Long roomId,
            @RequestParam(required = false) Long cursorId,
            @RequestParam(defaultValue = "30") int size
    ) {
        size = Math.min(Math.max(size, 1), 100); // 최소 1, 최대 100
        return roomHistoryService.getHistory(me.getUser(), roomId, cursorId, size);
    }
}
