package com.sandwich.SandWich.message.service;

import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.room.dto.RoomMetaResponse;
import com.sandwich.SandWich.message.room.repository.RoomMetaRow;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomMetaService {

    private final MessageRoomRepository roomRepository;

    public RoomMetaResponse getMeta(User me, Long roomId) {
        // 권한 체크: 내가 이 방의 참가자인가?
        boolean ok = roomRepository.isParticipant(roomId, me.getId());
        if (!ok) throw new AccessDeniedException("해당 채팅방에 접근 권한이 없습니다.");

        RoomMetaRow row = roomRepository.findRoomMeta(me.getId(), roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        return RoomMetaResponse.builder()
                .roomId(row.getRoomId())
                .partnerId(row.getPartnerId())
                .partnerName(row.getPartnerName())
                .partnerAvatarUrl(row.getPartnerAvatarUrl())
                .lastMessageId(row.getLastMessageId())
                .lastMessageType(row.getLastMessageType())
                .lastMessagePreview(row.getLastMessagePreview() == null ? "" : row.getLastMessagePreview())
                .lastMessageAt(row.getLastMessageAt())
                .unreadCount(row.getUnreadCount() == null ? 0L : row.getUnreadCount())
                .build();
    }
}