package com.sandwich.SandWich.repository;

import com.sandwich.SandWich.domain.Interest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterestRepository extends JpaRepository<Interest, Long> {
    List<Interest> findByNameIn(List<String> names);  // 관심분야 이름 리스트로 찾기
}