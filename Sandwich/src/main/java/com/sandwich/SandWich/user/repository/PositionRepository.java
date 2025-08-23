package com.sandwich.SandWich.user.repository;

import com.sandwich.SandWich.user.domain.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PositionRepository extends JpaRepository<Position, Long> {
    Optional<Position> findByName(String name);  // 포지션 이름으로 조회 (ex: "백엔드 개발자")
    List<Position> findAllByOrderByNameAsc();  // 메타 API용: 전체 + 이름순
}