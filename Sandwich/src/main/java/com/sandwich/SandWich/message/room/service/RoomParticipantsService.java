package com.sandwich.SandWich.message.room.service;

import com.sandwich.SandWich.message.domain.MessageRoom;
import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.room.dto.RoomParticipantResponse;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomParticipantsService {

    private final MessageRoomRepository roomRepository;

    public List<RoomParticipantResponse> getParticipants(User me, Long roomId) {
        // 단일 쿼리: 권한 체크 + 유저/프로필 로딩
        MessageRoom room = roomRepository.findByIdWithUsersIfParticipant(roomId, me.getId())
                .orElseThrow(() -> new AccessDeniedException("해당 채팅방에 접근 권한이 없습니다."));

        User u1 = room.getUser1();
        User u2 = room.getUser2();

        // DTO 매핑 (현재 DTO: id, nickname, profileImage)
        RoomParticipantResponse p1 = toDto(u1);
        RoomParticipantResponse p2 = toDto(u2);

        // 정렬만 "나 → 상대"로 (isMe 필드 없이 지역변수로 판단)
        boolean p1IsMe = u1.getId().equals(me.getId());
        return p1IsMe ? List.of(p1, p2) : List.of(p2, p1);
    }

    private RoomParticipantResponse toDto(User user) {
        String nickname = (user.getProfile() != null && user.getProfile().getNickname() != null)
                ? user.getProfile().getNickname()
                : user.getUsername();

        String profileImage = (user.getProfile() != null)
                ? user.getProfile().getProfileImage()
                : null;

        return RoomParticipantResponse.builder()
                .id(user.getId())
                .nickname(nickname)
                .profileImage(profileImage)
                .build();
    }
}