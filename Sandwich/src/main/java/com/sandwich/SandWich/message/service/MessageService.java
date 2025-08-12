
package com.sandwich.SandWich.message.service;

import com.sandwich.SandWich.global.exception.exceptiontype.*;
import com.sandwich.SandWich.message.domain.*;
import com.sandwich.SandWich.message.dto.MessageResponse;
import com.sandwich.SandWich.message.dto.SendMessageRequest;
import com.sandwich.SandWich.message.repository.MessageRepository;
import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRoomRepository roomRepo;
    private final MessageRepository messageRepo;
    private final UserRepository userRepo;
    private final MessagePreferenceService prefService; // 수신 토글 확인

    @Transactional
    public MessageResponse send(User me, SendMessageRequest req) {

        if (me.getId().equals(req.getTargetUserId())) {
            throw new IllegalArgumentException("자기 자신에게는 보낼 수 없습니다.");
        }

        User target = userRepo.findById(req.getTargetUserId())
                .orElseThrow(() -> new UserNotFoundException("상대 사용자를 찾을 수 없습니다."));

        // 1) 수신 토글 검사
        if (!prefService.isAllowedToReceive(target.getId(), req.getType())) {
            throw new MessageNotAllowedException("상대방이 이 유형의 메시지 수신을 허용하지 않습니다.");
        }

        // 2) 타입별 유효성 검증
        validateByType(req);

        // 3) 방 찾거나 생성
        MessageRoom room = roomRepo.findBetween(me.getId(), target.getId())
                .orElseGet(() -> {
                    MessageRoom r = MessageRoom.builder()
                            .user1(me.getId() < target.getId() ? me : target)
                            .user2(me.getId() < target.getId() ? target : me)
                            .build();
                    return roomRepo.save(r);
                });

        // 4) 메시지 생성
        Message msg = toEntity(room, me, target, req);
        msg = messageRepo.save(msg);

        // 5) 마지막 메시지 정보 갱신(미리보기)
        room.setLastMessageType(msg.getType());
        room.setLastMessagePreview(buildPreview(msg));
        // BaseEntity의 updatedAt 갱신됨
        // flush는 트랜잭션 종료 시점에

        // 6) 웹소켓 브로드캐스트 (지금은 빈 구현)
        broadcastToWebSocketClients(msg);

        return toDto(msg);
    }

    private void validateByType(SendMessageRequest req) {
        switch (req.getType()) {
            case GENERAL -> {
                if (!StringUtils.hasText(req.getContent())) {
                    throw new IllegalArgumentException("일반 메시지는 content가 필요합니다.");
                }
            }
            case EMOJI -> {
                if (!StringUtils.hasText(req.getContent())) {
                    throw new IllegalArgumentException("이모지 메시지는 content가 필요합니다.");
                }
                // content가 유니코드 이모지인지까지는 지금은 생략
            }
            case JOB_OFFER -> {
                if (!StringUtils.hasText(req.getCompanyName())
                        || !StringUtils.hasText(req.getPosition())
                        || !StringUtils.hasText(req.getLocation())
                        || req.getIsNegotiable() == null) {
                    throw new IllegalArgumentException("채용 제안 필수 항목(companyName, position, location, isNegotiable)을 입력하세요.");
                }
                // isNegotiable == true면 salary 무시, false면 salary 필수
                if (Boolean.FALSE.equals(req.getIsNegotiable()) && !StringUtils.hasText(req.getSalary())) {
                    throw new IllegalArgumentException("isNegotiable=false일 때 salary는 필수입니다.");
                }
            }
            case PROJECT_OFFER -> {
                if (!StringUtils.hasText(req.getTitle())
                        || !StringUtils.hasText(req.getContact())
                        || !StringUtils.hasText(req.getBudget())
                        || req.getIsNegotiable() == null) {
                    throw new IllegalArgumentException("프로젝트 제안 필수 항목(title, contact, budget, isNegotiable)을 입력하세요.");
                }
            }
        }
    }

    private Message toEntity(MessageRoom room, User me, User target, SendMessageRequest req) {
        Message.MessageBuilder b = Message.builder()
                .room(room)
                .sender(me)
                .receiver(target)
                .type(req.getType())
                .isRead(false);

        switch (req.getType()) {
            case GENERAL -> b.content(req.getContent());
            case EMOJI   -> b.content(req.getContent());
            case JOB_OFFER -> {
                b.companyName(req.getCompanyName());
                b.position(req.getPosition());
                b.salary(Boolean.TRUE.equals(req.getIsNegotiable()) ? null : req.getSalary());
                b.location(req.getLocation());
                b.isNegotiable(req.getIsNegotiable());
                b.cardDescription(req.getDescription());
                b.content(null); // 카드형은 content 비우고 카드 필드로 표현
            }
            case PROJECT_OFFER -> {
                b.title(req.getTitle());
                b.contact(req.getContact());
                b.budget(req.getBudget());
                b.isNegotiable(req.getIsNegotiable());
                b.cardDescription(req.getDescription());
                b.content(null);
            }
        }
        return b.build();
    }

    private String buildPreview(Message m) {
        return switch (m.getType()) {
            case GENERAL -> truncate(m.getContent(), 80);
            case EMOJI   -> m.getContent();
            case JOB_OFFER -> "[채용 제안] " + (m.getPosition() != null ? m.getPosition() : "");
            case PROJECT_OFFER -> "[프로젝트 제안] " + (m.getTitle() != null ? m.getTitle() : "");
        };
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    private void broadcastToWebSocketClients(Message message) {
        // TODO: 4단계에서 구현 (현재는 비워둠)
    }

    private MessageResponse toDto(Message m) {
        return MessageResponse.builder()
                .messageId(m.getId())
                .roomId(m.getRoom().getId())
                .senderId(m.getSender().getId())
                .receiverId(m.getReceiver().getId())
                .type(m.getType())
                .content(m.getContent())
                .isRead(m.isRead())
                .companyName(m.getCompanyName())
                .position(m.getPosition())
                .salary(m.getSalary())
                .location(m.getLocation())
                .isNegotiable(m.getIsNegotiable())
                .title(m.getTitle())
                .contact(m.getContact())
                .budget(m.getBudget())
                .description(m.getCardDescription())
                .build();
    }


    @Transactional
    public int markRoomAsRead(User me, Long roomId) {
        var room = roomRepo.findById(roomId)
                .orElseThrow(MessageRoomNotFoundException::new);

        // 방 참여자 권한 체크
        Long u1 = room.getUser1().getId();
        Long u2 = room.getUser2().getId();
        if (!me.getId().equals(u1) && !me.getId().equals(u2)) {
            throw new MessageRoomForbiddenException();

        }

        // 읽음 처리
        return messageRepo.markAsRead(roomId, me.getId());
    }
}
