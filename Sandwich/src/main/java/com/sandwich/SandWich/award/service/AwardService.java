package com.sandwich.SandWich.award.service;

import com.sandwich.SandWich.award.domain.Award;
import com.sandwich.SandWich.award.dto.AwardRequest;
import com.sandwich.SandWich.award.dto.AwardResponse;
import com.sandwich.SandWich.award.repository.AwardRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AwardService {

    private final AwardRepository awardRepository;
    private final UserRepository userRepository;

    public void create(AwardRequest request, Long userId) {
        User user = getUser(userId);
        Award award = new Award(
                request.title(),
                request.issuer(),
                request.year(),
                request.month(),
                request.description(),
                request.isRepresentative(),
                user
        );
        awardRepository.save(award);
    }

    public void update(Long id, AwardRequest request, Long userId) {
        Award award = getByIdAndUser(id, userId);
        award.update(
                request.title(),
                request.issuer(),
                request.year(),
                request.month(),
                request.description(),
                request.isRepresentative()
        );
    }

    public void delete(Long id, Long userId) {
        Award award = getByIdAndUser(id, userId);
        awardRepository.delete(award);
    }

    public List<AwardResponse> getMyAwards(Long userId) {
        return awardRepository.findByUser(getUser(userId))
                .stream().map(AwardResponse::from).toList();
    }

    public boolean toggleRepresentative(Long id, Long userId) {
        Award award = getByIdAndUser(id, userId);
        award.toggleRepresentative();
        return award.isRepresentative();
    }

    public List<Award> getRepresentativeAwards(User user) {
        return awardRepository.findByUserAndIsRepresentativeTrue(user);
    }

    private Award getByIdAndUser(Long id, Long userId) {
        Award award = awardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 수상 없음"));
        if (!award.getUser().getId().equals(userId)) {
            throw new SecurityException("권한 없음");
        }
        return award;
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
    }
}
