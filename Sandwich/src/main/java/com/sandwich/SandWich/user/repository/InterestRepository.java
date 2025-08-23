package com.sandwich.SandWich.user.repository;

import com.sandwich.SandWich.user.domain.Interest;
import com.sandwich.SandWich.user.domain.InterestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterestRepository extends JpaRepository<Interest, Long> {
    List<Interest> findByNameIn(List<String> names);  // 관심분야 이름 리스트로 찾기
    List<Interest> findByType(InterestType type);
    List<Interest> findByTypeOrderByNameAsc(InterestType type);  // 메타 API용: 타입별 + 이름순
}