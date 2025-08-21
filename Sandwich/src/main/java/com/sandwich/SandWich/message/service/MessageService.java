
package com.sandwich.SandWich.message.service;

import com.sandwich.SandWich.global.exception.exceptiontype.*;
import com.sandwich.SandWich.message.domain.*;
import com.sandwich.SandWich.message.dto.MessageResponse;
import com.sandwich.SandWich.message.dto.SendMessageRequest;
import com.sandwich.SandWich.message.repository.MessageRepository;
import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.util.ChatScreenshotRenderer;
import com.sandwich.SandWich.message.util.MessagePreviewer;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import java.util.Map;

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

        // 2) 타입별 유효성 검증(예: PROJECT_OFFER면 budget 필수, JOB_OFFER는 협의면 salary 무시 등)
        validateByType(req);

        // 3) 방 찾거나 생성
        MessageRoom room = roomRepo.findBetween(me.getId(), target.getId())
                .orElseGet(() -> roomRepo.save(
                        MessageRoom.builder()
                                .user1(me.getId() < target.getId() ? me : target)
                                .user2(me.getId() < target.getId() ? target : me)
                                .build()
                ));

        // 4) 메시지 생성 및 타입별 매핑 + payload 저장
        Message msg = toEntity(room, me, target, req);

        // 프론트가 보낸 payload만 저장(없으면 null)
        if (req.getPayload() != null && !req.getPayload().isBlank()) {
            msg.setPayload(req.getPayload());
        }

        msg = messageRepo.save(msg);

        // 5) 마지막 메시지 미리보기 갱신
        room.setLastMessage(msg);
        room.setLastMessageType(msg.getType());
        room.setLastMessagePreview(MessagePreviewer.preview(msg));
        room.setLastMessageAt(msg.getCreatedAt());

        // 6) (나중에 구현) 웹소켓 브로드캐스트
        broadcastToWebSocketClients(msg);

        // 7) 응답 DTO
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
                .payload(m.getPayload())
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

    @Transactional
    public MessageResponse getMessage(User me, Long messageId) {
        var m = messageRepo.findById(messageId)
                .orElseThrow(MessageNotFoundException::new);

        // 권한 체크: 채팅방 참여자(둘 중 하나)만 조회 가능
        Long u1 = m.getRoom().getUser1().getId();
        Long u2 = m.getRoom().getUser2().getId();
        if (!me.getId().equals(u1) && !me.getId().equals(u2)) {
            throw new MessageRoomForbiddenException();
        }

        return toDto(m); // 이미 서비스에 있는 변환 메서드 재사용
    }

    @Transactional(readOnly = true)
    public byte[] generateRoomScreenshot(User me, Long roomId) {
        var room = roomRepo.findById(roomId)
                .orElseThrow(MessageRoomNotFoundException::new);

        Long u1 = room.getUser1().getId();
        Long u2 = room.getUser2().getId();
        if (!me.getId().equals(u1) && !me.getId().equals(u2)) {
            throw new MessageRoomForbiddenException();
        }

        var list = messageRepo.findAllByRoomIdOrderByCreatedAtAsc(roomId);
        try {
            return ChatScreenshotRenderer.renderPng(list, me.getId());
        } catch (Exception e) {
            throw new RuntimeException("스크린샷 생성 중 오류", e);
        }
    }

    @Transactional
    public Map<String, Object> deleteMessage(User me, Long messageId, String mode) {
        var message = messageRepo.findWithRoomById(messageId)
                .orElseThrow(MessageNotFoundException::new);

        // 보낸 사람 본인만 삭제 가능
        if (!message.getSender().getId().equals(me.getId())) {
            throw new ForbiddenException("본인이 보낸 메시지만 삭제할 수 있습니다.");
        }

        if (mode == null || mode.isBlank()) mode = "mask";
        Long roomId = message.getRoom().getId();

        switch (mode.toLowerCase()) {
            case "mask" -> {
                if (message.isDeleted()) {
                    throw new ConflictException("이미 마스킹된 메시지입니다.");
                }
                message.setDeleted(true);
                message.setDeletedAt(java.time.OffsetDateTime.now());
                message.setDeletedByUserId(me.getId());
                message.setContent("삭제된 메시지입니다");
                // 카드형 필드는 그대로 두되, 프리뷰는 "삭제된 메시지입니다"로 보이게 됨
            }
            case "hard" -> {
                // 하드 삭제는 실데이터 제거 (첨부/리액션 FK가 있으면 ON DELETE CASCADE 권장)
                messageRepo.delete(message);
            }
            default -> throw new BadRequestException("mode는 mask|hard 중 하나여야 합니다.");
        }

        // 마지막 메시지 프리뷰/타입 재계산 (하드/마스킹 모두 영향)
        refreshRoomLastMessage(roomId);

        return Map.of(
                "message", "삭제 처리 완료",
                "mode", mode,
                "roomId", roomId,
                "messageId", messageId
        );
    }

    private void refreshRoomLastMessage(Long roomId) {
        var top1 = messageRepo.findLatestNotDeletedByRoomId(roomId, PageRequest.of(0, 1));
        var room = roomRepo.findById(roomId).orElseThrow(MessageRoomNotFoundException::new);

        if (top1.isEmpty()) {
            // 방에 남은(마스킹 제외) 메시지가 없으면 비우기
            room.setLastMessageType(null);
            room.setLastMessagePreview(null);
            // room.setLastMessageAt(null);  // 만약 필드가 있다면 같이 null 처리
        } else {
            var last = top1.get(0);
            room.setLastMessageType(last.getType());
            room.setLastMessagePreview(extractPreview(last));
            // room.setLastMessageAt(last.getCreatedAt()); // 필드 있으면 갱신
        }
        // JPA 변경감지로 flush
    }

    private String extractPreview(Message m) {
        return switch (m.getType()) {
            case GENERAL -> {
                var s = m.getContent();
                yield (s == null || s.length() <= 80) ? s : s.substring(0, 80) + "...";
            }
            case EMOJI -> m.getContent();
            case JOB_OFFER -> "[채용 제안] " + (m.getPosition() != null ? m.getPosition() : "");
            case PROJECT_OFFER -> "[프로젝트 제안] " + (m.getTitle() != null ? m.getTitle() : "");
        };
    }

}
