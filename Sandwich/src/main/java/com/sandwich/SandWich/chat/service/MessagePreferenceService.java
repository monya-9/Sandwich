package com.sandwich.SandWich.chat.service;

import com.sandwich.SandWich.chat.domain.UserMessagePreference;
import com.sandwich.SandWich.chat.dto.MessagePreferenceResponse;
import com.sandwich.SandWich.chat.dto.UpdateMessagePreferenceRequest;
import com.sandwich.SandWich.chat.repository.UserMessagePreferenceRepository;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MessagePreferenceService {
    private final UserMessagePreferenceRepository repo;

    @Transactional(readOnly = true)
    public MessagePreferenceResponse getMy(User me) {
        var pref = repo.findByUserId(me.getId()).orElseGet(() ->
                UserMessagePreferenceFactory.defaultOf(me) // 아래 static 팩토리 참고
        );
        return toResponse(pref);
    }

    @Transactional
    public MessagePreferenceResponse updateMy(User me, UpdateMessagePreferenceRequest req) {
        var pref = repo.findByUserId(me.getId())
                .orElseGet(() -> {
                    var p = new UserMessagePreference();
                    p.setUser(me);
                    return repo.save(p);
                });
        if (req.getAllowProjectOffer() != null) pref.setAllowProjectOffer(req.getAllowProjectOffer());
        if (req.getAllowJobOffer() != null) pref.setAllowJobOffer(req.getAllowJobOffer());
        return toResponse(pref);
    }

    @Transactional(readOnly = true)
    public MessagePreferenceResponse getPublicFor(Long targetUserId) {
        var pref = repo.findByUserId(targetUserId)
                .orElseGet(() -> { // 없으면 기본 true로 가정
                    var p = new UserMessagePreference();
                    p.setAllowProjectOffer(true);
                    p.setAllowJobOffer(true);
                    return p;
                });
        return toResponse(pref);
    }

    private MessagePreferenceResponse toResponse(UserMessagePreference p) {
        var res = new MessagePreferenceResponse();
        res.setAllowProjectOffer(p.isAllowProjectOffer());
        res.setAllowJobOffer(p.isAllowJobOffer());
        return res;
    }


}

final class UserMessagePreferenceFactory {
    static UserMessagePreference defaultOf(User me) {
        var p = new UserMessagePreference();
        p.setUser(me);
        p.setAllowProjectOffer(true);
        p.setAllowJobOffer(true);
        return p;
    }
}
