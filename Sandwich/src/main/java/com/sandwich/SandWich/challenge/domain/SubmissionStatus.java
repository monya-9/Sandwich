package com.sandwich.SandWich.challenge.domain;

public enum SubmissionStatus {
    // 포트폴리오
    SUBMITTED,

    // 코드 채점 플로우
    PENDING,    // 제출 직후
    RUNNING,    // 그레이더 실행중
    PASSED,     // 모든 테스트 통과
    FAILED,     // 일부/전체 실패
    SCORED      // 점수 산출(가중치/커버리지 등 반영)
}