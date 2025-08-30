
package com.sandwich.SandWich.message.service;

import com.sandwich.SandWich.common.exception.exceptiontype.*;
import com.sandwich.SandWich.message.attach.repository.AttachmentMetadataRepository;
import com.sandwich.SandWich.message.attach.storage.StorageService;
import com.sandwich.SandWich.message.attach.util.DefaultThumbnailResolver;
import com.sandwich.SandWich.message.attach.util.ThumbnailResolver;
import com.sandwich.SandWich.message.domain.*;
import com.sandwich.SandWich.message.dto.MessageResponse;
import com.sandwich.SandWich.message.dto.MessageType;
import com.sandwich.SandWich.message.dto.SendMessageRequest;
import com.sandwich.SandWich.message.repository.MessageRepository;
import com.sandwich.SandWich.message.repository.MessageRoomRepository;
import com.sandwich.SandWich.message.util.ChatScreenshotRenderer;
import com.sandwich.SandWich.message.util.MessagePreviewer;
import com.sandwich.SandWich.notification.fanout.MessageFanoutHelper;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRoomRepository roomRepo;
    private final MessageRepository messageRepo;
    private final UserRepository userRepo;
    private final MessagePreferenceService prefService; // 수신 토글 확인
    private final AttachmentMetadataRepository attachmentMetadataRepository;
    private final StorageService storageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageFanoutHelper fanoutHelper;

    // 클래스 상단에 재사용용 ObjectMapper 하나 두기
    private static final ObjectMapper OM = new ObjectMapper();

    @Transactional
    public MessageResponse send(User me, SendMessageRequest req) {

        if (me.getId().equals(req.getTargetUserId())) {
            throw new IllegalArgumentException("자기 자신에게는 보낼 수 없습니다.");
        }

        User target = userRepo.findById(req.getTargetUserId())
                .orElseThrow(() -> new UserNotFoundException("상대 사용자를 찾을 수 없습니다."));

        // 수신 토글 검사
        if (!prefService.isAllowedToReceive(target.getId(), req.getType())) {
            throw new MessageNotAllowedException("상대방이 이 유형의 메시지 수신을 허용하지 않습니다.");
        }

        // 타입별 유효성 검증(예: PROJECT_OFFER면 budget 필수, JOB_OFFER는 협의면 salary 무시 등)
        validateByType(req);

        // 방 찾거나 생성
        MessageRoom room = roomRepo.findBetween(me.getId(), target.getId())
                .orElseGet(() -> roomRepo.save(
                        MessageRoom.builder()
                                .user1(me.getId() < target.getId() ? me : target)
                                .user2(me.getId() < target.getId() ? target : me)
                                .build()
                ));

        // 중복 체크: nonce가 있으면 기존 메시지 먼저 검색
        if (req.getClientNonce() != null && !req.getClientNonce().isBlank()) {
            var dup = messageRepo.findBySenderIdAndRoomIdAndClientNonce(
                    me.getId(), room.getId(), req.getClientNonce());
            if (dup.isPresent()) {
                // 이미 저장된 동일 메시지 → 재브로드캐스트 금지, 기존 DTO만 반환
                return toDto(dup.get());
            }
        }

        // 메시지 생성 및 타입별 매핑 + payload 저장
        Message msg = toEntity(room, me, target, req);

        // 프론트가 보낸 payload만 저장(없으면 null)
        if (req.getPayload() != null && !req.getPayload().isBlank()) {
            msg.setPayload(req.getPayload());
        }

        // 중복 방지용 clientNonce 저장
        if (req.getClientNonce() != null && !req.getClientNonce().isBlank()) {
            msg.setClientNonce(req.getClientNonce());
        }

        // 저장 (+동시성 대비)
        try {
            msg = messageRepo.save(msg);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            if (msg.getClientNonce() != null) {
                var dup = messageRepo.findBySenderIdAndRoomIdAndClientNonce(
                        me.getId(), room.getId(), msg.getClientNonce());
                if (dup.isPresent()) return toDto(dup.get());
            }
            throw ex;
        }

        // 마지막 메시지 미리보기 갱신
        room.setLastMessage(msg);
        room.setLastMessageType(msg.getType());
        room.setLastMessagePreview(MessagePreviewer.preview(msg));
        room.setLastMessageAt(msg.getCreatedAt());

        // 웹소켓 브로드캐스트
        broadcastToWebSocketClients(msg);

        // FCM/WebPush 팬아웃 (상대가 오프라인/미구독이면만)
        try {
            Long roomId   = msg.getRoom().getId();
            Long targetId = msg.getReceiver().getId(); // 상대
            String sender = msg.getSender().getNickname();
            String prev   = MessagePreviewer.preview(msg);

            fanoutHelper.maybeSendWebPush(
                    targetId,
                    roomId,
                    sender == null ? "" : sender,
                    prev == null ? "" : prev,
                    Map.of("messageId", String.valueOf(msg.getId())) // 선택
            );
        } catch (Exception ex) {
            log.warn("[FANOUT][WARN] push fanout failed msgId={} : {}", msg.getId(), ex.toString());
        }

        // 응답 DTO
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

    @Transactional
    public Message sendFromWebSocket(User me, Long roomId, com.sandwich.SandWich.message.ws.dto.WsSendMessageRequest req) {
        if (roomId == null || !roomRepo.isParticipant(roomId, me.getId())) {
            throw new MessageRoomForbiddenException();
        }

        // 방 로딩(상대 결정)
        var room = roomRepo.findByIdWithUsersIfParticipant(roomId, me.getId())
                .orElseThrow(MessageRoomNotFoundException::new);

        User receiver = room.getUser1().getId().equals(me.getId()) ? room.getUser2() : room.getUser1();

        // 중복 체크: clientNonce가 있으면 기존 메시지 반환
        if (req.getClientNonce() != null && !req.getClientNonce().isBlank()) {
            var dup = messageRepo.findBySenderIdAndRoomIdAndClientNonce(
                    me.getId(), roomId, req.getClientNonce());
            if (dup.isPresent()) {
                return dup.get(); // 저장/브로드캐스트 생략
            }
        }

        // 타입/필수값 검증: 기존 validateByType 재사용 위해 SendMessageRequest로 매핑해도 되고, 간단히 분기해도 됨
        // 여기서는 최소 구현: GENERAL/EMOJI만 바로, 카드형은 필드 존재 시 반영
        com.sandwich.SandWich.message.domain.Message.MessageBuilder b = Message.builder()
                .room(room)
                .sender(me)
                .receiver(receiver)
                .isRead(false);

        String type = (req.getType() == null) ? "GENERAL" : req.getType();
        switch (type) {
            case "GENERAL" -> {
                if (req.getContent() == null || req.getContent().isBlank())
                    throw new IllegalArgumentException("content 필요");
                b.type(MessageType.GENERAL).content(req.getContent());
            }
            case "EMOJI" -> {
                if (req.getContent() == null || req.getContent().isBlank())
                    throw new IllegalArgumentException("이모지 content 필요");
                b.type(MessageType.EMOJI).content(req.getContent());
            }
            case "JOB_OFFER" -> {
                b.type(MessageType.JOB_OFFER)
                        .companyName(req.getCompanyName())
                        .position(req.getPosition())
                        .salary(Boolean.TRUE.equals(req.getIsNegotiable()) ? null : req.getSalary())
                        .location(req.getLocation())
                        .isNegotiable(req.getIsNegotiable())
                        .cardDescription(req.getDescription())
                        .content(null);
            }
            case "PROJECT_OFFER" -> {
                b.type(MessageType.PROJECT_OFFER)
                        .title(req.getTitle())
                        .contact(req.getContact())
                        .budget(req.getBudget())
                        .isNegotiable(req.getIsNegotiable())
                        .cardDescription(req.getDescription())
                        .content(null);
            }
            default -> throw new IllegalArgumentException("지원하지 않는 type: " + type);
        }

        // clientNonce 저장(옵션)
        if (req.getClientNonce() != null && !req.getClientNonce().isBlank()) {
            b.clientNonce(req.getClientNonce());
        }

        Message saved;
        try {
            saved = messageRepo.save(b.build());
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            // 동시 저장 레이스일 때 안전 복구
            if (req.getClientNonce() != null && !req.getClientNonce().isBlank()) {
                var dup = messageRepo.findBySenderIdAndRoomIdAndClientNonce(
                        me.getId(), roomId, req.getClientNonce());
                if (dup.isPresent()) return dup.get();
            }
            throw ex;
        }

        // 마지막 메시지 갱신
        room.setLastMessage(saved);
        room.setLastMessageType(saved.getType());
        room.setLastMessagePreview(MessagePreviewer.preview(saved));
        room.setLastMessageAt(saved.getCreatedAt());

        // WS 브로드캐스트 훅에서도 쏘도록(REST 경로 일원화)
        broadcastToWebSocketClients(saved);

        try {
            Long targetId = saved.getReceiver().getId();
            String sender = saved.getSender().getNickname();
            String prev   = MessagePreviewer.preview(saved);

            fanoutHelper.maybeSendWebPush(
                    targetId, roomId,
                    sender == null ? "" : sender,
                    prev == null ? "" : prev,
                    Map.of("messageId", String.valueOf(saved.getId()))
            );
        } catch (Exception ex) {
            log.warn("[FANOUT][WARN] push fanout failed msgId={} : {}", saved.getId(), ex.toString());
        }

        return saved;
    }

    private void broadcastToWebSocketClients(Message m) {
        log.info("[WS][BROADCAST] room={} messageId={} nonce={}",
                m.getRoom().getId(), m.getId(), m.getClientNonce());

        // REST로 보낸 메시지도 동일 경로로 브로드캐스트 (양방향 경로 통합)
        var out = com.sandwich.SandWich.message.ws.dto.WsMessageBroadcast.builder()
                .roomId(m.getRoom().getId())
                .messageId(m.getId())
                .senderId(m.getSender().getId())
                .senderNickname(m.getSender().getNickname())
                .content(m.getContent())
                .type(m.getType().name())
                .isRead(false)
                .sentAt(m.getCreatedAt())
                .build();

        messagingTemplate.convertAndSend("/topic/rooms/" + m.getRoom().getId(), out);
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
            // 썸네일까지 그리고 싶을 때:
            ThumbnailResolver resolver =
                    new DefaultThumbnailResolver(attachmentMetadataRepository, storageService);
            return ChatScreenshotRenderer.renderPng(list, me.getId(), resolver);

            // 만약 썸네일 없이 텍스트만 먼저 확인하려면 ↓ 이 한 줄로 바꾸기
            // return ChatScreenshotRenderer.renderPng(list, me.getId());
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
                message.setDeletedAt(OffsetDateTime.now());
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
        var room = roomRepo.findById(roomId).orElseThrow(MessageRoomNotFoundException::new);
        var last = messageRepo.findTopByRoomIdOrderByIdDesc(roomId); // 삭제 포함 최신 1건

        if (last == null) {
            room.setLastMessageType(null);
            room.setLastMessagePreview(null);
            // room.setLastMessageAt(null);
        } else {
            room.setLastMessageType(last.getType());
            room.setLastMessagePreview(MessagePreviewer.preview(last)); // 삭제면 "삭제된 메시지입니다"
            room.setLastMessageAt(last.getCreatedAt()); // 주석 해제 추천
        }
    }

    private String extractPreview(Message m) {
        return MessagePreviewer.preview(m); // GENERAL/EMOJI/카드/ATTACHMENT 모두 일관 처리
    }


    @Transactional
    public MessageResponse createAttachmentMessage(Long roomId, User sender,
                                                   String fileUrl, String originalName,
                                                   String mimeType, long size) {
        var room = roomRepo.findById(roomId)
                .orElseThrow(MessageRoomNotFoundException::new);

        if (!roomRepo.isParticipant(roomId, sender.getId())) {
            throw new MessageRoomForbiddenException();
        }

        User receiver = room.getUser1().getId().equals(sender.getId())
                ? room.getUser2() : room.getUser1();

        String payloadJson = buildAttachmentPayload(fileUrl, originalName, mimeType, size);

        Message msg = Message.builder()
                    .room(room)
                    .sender(sender)
                    .receiver(receiver)
                    .type(MessageType.ATTACHMENT)
                    .content(null)
                    .payload(payloadJson)
                    .isRead(false)
                    .build();

        msg = messageRepo.save(msg);

        room.setLastMessage(msg);
        room.setLastMessageType(msg.getType());
        room.setLastMessagePreview("[첨부파일] " + (originalName == null ? "" : originalName));
        room.setLastMessageAt(msg.getCreatedAt());

        broadcastToWebSocketClients(msg);
        return toDto(msg);
    }

    private String buildAttachmentPayload(String url, String name, String mime, long size) {
        var map = new java.util.LinkedHashMap<String, Object>();
        map.put("url", url);
        map.put("name", name == null ? "" : name);
        map.put("mime", mime == null ? "" : mime);
        map.put("size", size);
        try {
            return OM.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("첨부 payload 직렬화 실패", e);
        }
    }

}
