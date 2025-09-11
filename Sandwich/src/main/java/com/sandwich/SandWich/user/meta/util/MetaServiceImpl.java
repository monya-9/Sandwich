package com.sandwich.SandWich.user.meta.util;

import com.sandwich.SandWich.user.domain.InterestType;
import com.sandwich.SandWich.user.domain.Interest;
import com.sandwich.SandWich.user.domain.Position;
import com.sandwich.SandWich.user.dto.InterestResponse;
import com.sandwich.SandWich.user.dto.PositionResponse;
import com.sandwich.SandWich.user.meta.service.MetaService;
import com.sandwich.SandWich.user.repository.InterestRepository;
import com.sandwich.SandWich.user.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MetaServiceImpl implements MetaService {

    private final InterestRepository interestRepository;
    private final PositionRepository positionRepository;

    @Override
    public List<InterestResponse> getInterestsByType(InterestType type) {
        List<Interest> rows = interestRepository.findByType(type);
        rows.sort(Comparator.comparing(Interest::getId));

        return rows.stream()
                .map(i -> new InterestResponse(i.getId(), i.getName()))
                .toList();
    }

    @Override
    public List<PositionResponse> getPositions() {
        List<Position> rows = positionRepository.findAll();
        rows.sort(Comparator.comparing(Position::getId));

        return rows.stream()
                .map(p -> new PositionResponse(p.getId(), p.getName()))
                .toList();
    }
}
