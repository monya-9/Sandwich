// src/constants/position.ts
export interface SimpleMeta { id: number; name: string; }

export const FALLBACK_POSITIONS: SimpleMeta[] = [
    { id: 1, name: "프론트엔드" },
    { id: 2, name: "백엔드" },
    { id: 3, name: "풀스택" },
    { id: 4, name: "모바일 앱" },
    { id: 5, name: "게임" },
    { id: 6, name: "AI/머신러닝" },
    { id: 7, name: "데이터 엔지니어링" },
    { id: 8, name: "임베디드/IOT" },
    { id: 9, name: "DevOps/인프라" },
    { id: 10, name: "웹" },
    { id: 11, name: "시스템 프로그래밍" },
    { id: 12, name: "블록체인" },
    { id: 13, name: "보안/해킹" },
];

export const FALLBACK_INTERESTS_GENERAL: SimpleMeta[] = [
    { id: 1,  name: "자료구조 & 알고리즘" },
    { id: 2,  name: "운영체제" },
    { id: 3,  name: "테스트 코드 작성 (TDD)" },
    { id: 4,  name: "디자인 패턴" },
    { id: 5,  name: "소프트웨어 아키텍처" },
    { id: 6,  name: "네트워크" },
    { id: 7,  name: "클린 코드" },
    { id: 8,  name: "CI / CD" },
    { id: 9,  name: "API 설계" },
    { id: 10, name: "운영환경" },
    { id: 11, name: "DB모델링/정규화" },
];

/** ✅ 기존 코드가 positionMap/interestMap을 import해도 빌드되도록 “호환 export” */
export const positionMap: Record<string, number> =
    Object.fromEntries(FALLBACK_POSITIONS.map(p => [p.name, p.id]));

export const interestMap: Record<string, number> =
    Object.fromEntries(FALLBACK_INTERESTS_GENERAL.map(i => [i.name, i.id]));
