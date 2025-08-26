package com.sandwich.SandWich.notification.service;

import com.sandwich.SandWich.notification.domain.NotificationPreference;
import com.sandwich.SandWich.notification.dto.NotificationPrefsResponse;
import com.sandwich.SandWich.notification.dto.NotificationPrefsUpdateRequest;
import com.sandwich.SandWich.notification.repository.NotificationPreferenceRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository repo;
    private final UserRepository userRepo;

    // 기본값 정책 한 곳에서 관리
    public NotificationPreference defaults(User user) {
        return NotificationPreference.builder()
                .user(user)
                .pushMessage(true)
                .pushComment(true)
                .pushLike(false)       // 정책
                .pushFollow(true)
                .pushEvent(false)      // 정책
                .pushWorkDigest(false) // 정책
                .emailMessage(false)
                .emailComment(false)
                .emailLike(false)
                .emailFollow(false)
                .emailEvent(false)
                .emailWorkDigest(false)
                .build();
    }

    @Transactional(readOnly = true)
    public NotificationPrefsResponse getMy(Long userId) {
        var pref = repo.findByUserId(userId)
                .orElseGet(() -> defaults(userRepo.findById(userId).orElseThrow()));
        return mapToResponse(pref);
    }

    @Transactional
    public NotificationPrefsResponse upsertMy(Long userId, NotificationPrefsUpdateRequest req) {
        var pref = repo.findByUserId(userId)
                .orElseGet(() -> defaults(userRepo.findById(userId).orElseThrow()));

        // null 무시(부분 업데이트)
        if (req.getPushMessage()     != null) pref.setPushMessage(req.getPushMessage());
        if (req.getPushComment()     != null) pref.setPushComment(req.getPushComment());
        if (req.getPushLike()        != null) pref.setPushLike(req.getPushLike());
        if (req.getPushFollow()      != null) pref.setPushFollow(req.getPushFollow());
        if (req.getPushEvent()       != null) pref.setPushEvent(req.getPushEvent());
        if (req.getPushWorkDigest()  != null) pref.setPushWorkDigest(req.getPushWorkDigest());

        if (req.getEmailMessage()     != null) pref.setEmailMessage(req.getEmailMessage());
        if (req.getEmailComment()     != null) pref.setEmailComment(req.getEmailComment());
        if (req.getEmailLike()        != null) pref.setEmailLike(req.getEmailLike());
        if (req.getEmailFollow()      != null) pref.setEmailFollow(req.getEmailFollow());
        if (req.getEmailEvent()       != null) pref.setEmailEvent(req.getEmailEvent());
        if (req.getEmailWorkDigest()  != null) pref.setEmailWorkDigest(req.getEmailWorkDigest());

        repo.save(pref);
        return mapToResponse(pref);
    }

    private NotificationPrefsResponse mapToResponse(NotificationPreference p) {
        return NotificationPrefsResponse.builder()
                .pushMessage(p.isPushMessage())
                .pushComment(p.isPushComment())
                .pushLike(p.isPushLike())
                .pushFollow(p.isPushFollow())
                .pushEvent(p.isPushEvent())
                .pushWorkDigest(p.isPushWorkDigest())
                .emailMessage(p.isEmailMessage())
                .emailComment(p.isEmailComment())
                .emailLike(p.isEmailLike())
                .emailFollow(p.isEmailFollow())
                .emailEvent(p.isEmailEvent())
                .emailWorkDigest(p.isEmailWorkDigest())
                .build();
    }
}