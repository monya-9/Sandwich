package com.sandwich.SandWich.repository;

import com.sandwich.SandWich.domain.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PositionRepository extends JpaRepository<Position, Long> {
    Optional<Position> findByName(String name);  // 포지션 이름으로 조회 (ex: "백엔드 개발자")
}