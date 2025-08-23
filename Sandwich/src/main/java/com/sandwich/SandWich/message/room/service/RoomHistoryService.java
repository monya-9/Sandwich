package com.sandwich.SandWich.message.room.service;

import com.sandwich.SandWich.message.domain.Message;
import com.sandwich.SandWich.message.dto.MessageItemResponse;
import com.sandwich.SandWich.message.dto.MessagePageResponse;
import com.sandwich.SandWich.message.dto.MessageType;
import com.sandwich.SandWich.message.repository.MessageRepository;
import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.util.MessagePreviewer;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomHistoryService {

    private final MessageRoomRepository messageRoomRepository;
    private final MessageRepository messageRepository;

    @Transactional(readOnly = true)
    public MessagePageResponse getHistory(User me, Long roomId, Long cursorId, int size) {
        // 1) 권한 체크
        if (!messageRoomRepository.isParticipant(roomId, me.getId())) {
            throw new AccessDeniedException("해당 채팅방에 접근 권한이 없습니다.");
        }

        // 2) 커서 조회 (최근→과거)
        Pageable pageable = PageRequest.of(0, size);
        List<Message> descList = messageRepository.findSliceByRoomIdAndCursor(roomId, cursorId, pageable);

        // 3) 페이징 정보
        boolean hasNext = descList.size() == size;
        Long nextCursorId = hasNext ? descList.get(descList.size() - 1).getId() : null;

        // 4) 오름차순으로 뒤집기
        Collections.reverse(descList);

        // 5) 매핑 (마스킹 정책 반영)
        List<MessageItemResponse> items = descList.stream()
                .map(m -> toItem(me, m))
                .toList();

        return MessagePageResponse.builder()
                .items(items)
                .nextCursorId(nextCursorId)
                .hasNext(hasNext)
                .build();
    }

    private MessageItemResponse toItem(User me, Message m) {
        boolean mine = m.getSender().getId().equals(me.getId());

        return MessageItemResponse.builder()
                .id(m.getId())
                .type(m.getType().name())
                .content(MessagePreviewer.preview(m))    // ← 히스토리에서는 프리뷰 텍스트로 내려줌
                .mine(mine)
                .read(m.isRead())
                .senderId(m.getSender().getId())
                .receiverId(m.getReceiver().getId())
                .createdAt(m.getCreatedAt()) // DTO가 OffsetDateTime이면 그대로 OK
                .deleted(m.isDeleted())
                .build();
    }
}
