package com.sandwich.SandWich.challenge.service;

import com.sandwich.SandWich.challenge.domain.*;
import com.sandwich.SandWich.challenge.dto.ChallengeListItem;
import com.sandwich.SandWich.challenge.dto.ChallengeDetail;
import com.sandwich.SandWich.challenge.repository.ChallengeRepository;
import com.sandwich.SandWich.challenge.repository.ChallengeSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChallengeQueryService {

    private final ChallengeRepository repository;

    public Page<ChallengeListItem> list(ChallengeType type, ChallengeStatus status, Pageable pageable) {
        Specification<Challenge> spec = Specification
                .where(ChallengeSpecifications.hasType(type))
                .and(ChallengeSpecifications.hasStatus(status));

        return repository.findAll(spec, pageable).map(ChallengeListItem::from);
    }

    public ChallengeDetail get(Long id) {
        Challenge c = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Challenge not found: " + id));
        return ChallengeDetail.from(c);
    }
}