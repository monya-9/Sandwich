package com.sandwich.SandWich.message.room.service;

import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.room.dto.RoomListItemResponse;
import com.sandwich.SandWich.message.room.repository.RoomListRow;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomQueryService {
    private final MessageRoomRepository roomRepository;

    public Page<RoomListItemResponse> getMyRooms(User me, Pageable pageable) {
        Page<RoomListRow> page = roomRepository.findRoomList(me.getId(), pageable);
        return page.map(this::toResponse);
    }

    private RoomListItemResponse toResponse(RoomListRow row) {
        return RoomListItemResponse.builder()
                .roomId(row.getRoomId())
                .partnerId(row.getPartnerId())
                .partnerName(row.getPartnerName())
                .partnerAvatarUrl(row.getPartnerAvatarUrl())
                .lastMessageId(row.getLastMessageId())
                .lastMessageType(row.getLastMessageType())
                .lastMessagePreview(maskPreview(row.getLastMessageType(), row.getLastMessagePreview()))
                .lastMessageAt(row.getLastMessageAt())
                .unreadCount(row.getUnreadCount() == null ? 0 : row.getUnreadCount())
                .build();
    }

    private String maskPreview(String type, String raw) {
        if (type == null) return raw == null ? "" : raw;
        switch (type) {
            case "EMOJI": return "이모지";
            case "PROJECT_OFFER": return "[프로젝트 제안]";
            case "JOB_OFFER": return "[채용 제안]";
            default: return raw == null ? "" : raw;
        }
    }
}
