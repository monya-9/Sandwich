import { Project } from '../types/Project';

export const dummyProjects: Project[] = [
  { id: 1, title: '고양이 밥주는 앱', authorId: 1, likes: 5, views: 206, comments: 8, categories: ['App', 'Game', 'AI/ML'], uploadDate: '2025-06-28T10:15:00' },
  { id: 2, title: '퇴사 후 세계일주 기록기', authorId: 2, likes: 47, views: 539, comments: 1, categories: ['Web', 'Game'], uploadDate: '2025-06-14T14:22:00' },
  { id: 3, title: '주식 자동 분석기', authorId: 3, likes: 38, views: 328, comments: 14, categories: ['Game', 'UI/UX', 'App'], uploadDate: '2025-07-01T09:05:00' },
  { id: 4, title: 'AI 얼굴 합성기', authorId: 4, likes: 41, views: 368, comments: 20, categories: ['App', 'UI/UX', 'Web'], uploadDate: '2025-06-30T20:50:00' },
  { id: 5, title: '매일의 감정일기', authorId: 5, likes: 94, views: 154, comments: 9, categories: ['Blockchain', 'UI/UX', 'AI/ML'], uploadDate: '2025-06-25T17:42:00' },
  { id: 6, title: '강아지 산책 시간 알림이', authorId: 6, likes: 96, views: 699, comments: 5, categories: ['AI/ML', 'UI/UX', 'Game'], uploadDate: '2025-06-24T06:00:00' },
  { id: 7, title: '대학생을 위한 할 일 관리 앱', authorId: 7, likes: 50, views: 364, comments: 3, categories: ['App', 'Game'], uploadDate: '2025-06-18T13:44:00' },
  { id: 8, title: '자취생을 위한 냉장고 관리', authorId: 8, likes: 48, views: 470, comments: 12, categories: ['UI/UX'], uploadDate: '2025-06-19T22:15:00' },
  { id: 9, title: 'MBTI별 궁합 분석기', authorId: 9, likes: 35, views: 493, comments: 18, categories: ['App'], uploadDate: '2025-06-26T08:05:00' },
  { id: 10, title: '나만의 웹툰 만들기', authorId: 10, likes: 58, views: 313, comments: 5, categories: ['AI/ML'], uploadDate: '2024-06-20' },
  { id: 11, title: '헬스 루틴 기록 서비스', authorId: 3, likes: 14, views: 337, comments: 17, categories: ['Game'], uploadDate: '2025-06-21T10:30:00' },
  { id: 12, title: '리액트로 만든 미니 게임', authorId: 4, likes: 76, views: 740, comments: 16, categories: ['Web', 'UI/UX'], uploadDate: '2025-06-29T15:42:00' },
  { id: 13, title: '영화 추천 사이트', authorId: 1, likes: 25, views: 622, comments: 18, categories: ['AI/ML', 'Game', 'App'], uploadDate: '2025-06-23T19:10:00' },
  { id: 14, title: 'AI와 그림 그리기', authorId: 11, likes: 0, views: 114, comments: 8, categories: ['Blockchain', 'AI/ML', 'UI/UX'], uploadDate: '2025-06-16T07:00:00' },
  { id: 15, title: '친구 생일 알림 챗봇', authorId: 5, likes: 46, views: 556, comments: 19, categories: ['App'], uploadDate: '2025-06-11T21:15:00' },
  { id: 16, title: '다이어트 식단 추천기', authorId: 3, likes: 98, views: 360, comments: 6, categories: ['App'], uploadDate: '2025-06-19T00:00:00' },
  { id: 17, title: '전공별 공부 시간 분석기', authorId: 5, likes: 93, views: 806, comments: 1, categories: ['Web', 'UI/UX', 'Blockchain'], uploadDate: '2025-06-26T00:00:00' },
  { id: 18, title: '우리 동네 맛집 지도', authorId: 16, likes: 80, views: 121, comments: 8, categories: ['Blockchain', 'Web', 'AI/ML'], uploadDate: '2025-06-29T00:00:00' },
  { id: 19, title: '방탈출 퍼즐 웹게임', authorId: 9, likes: 15, views: 243, comments: 2, categories: ['Blockchain', 'UI/UX'], uploadDate: '2025-06-21T00:00:00' },
  { id: 20, title: '세계 랜덤 여행지 추천기', authorId: 3, likes: 58, views: 589, comments: 4, categories: ['Game', 'UI/UX', 'App'], uploadDate: '2025-06-08T00:00:00' },
  { id: 21, title: '코딩 공부 통계 시각화', authorId: 13, likes: 63, views: 945, comments: 18, categories: ['App', 'UI/UX'], uploadDate: '2025-07-01T00:00:00' },
  { id: 22, title: '학생용 가계부 앱', authorId: 6, likes: 8, views: 521, comments: 10, categories: ['Game', 'App'], uploadDate: '2025-06-11T00:00:00' },
  { id: 23, title: '주간 목표 트래커', authorId: 6, likes: 16, views: 899, comments: 4, categories: ['Web'], uploadDate: '2025-06-15T00:00:00' },
  { id: 24, title: '랜덤 카페 추천기', authorId: 1, likes: 71, views: 949, comments: 9, categories: ['Web', 'Blockchain'], uploadDate: '2025-06-06T00:00:00' },
  { id: 25, title: '감성 사진 앨범 웹', authorId: 6, likes: 90, views: 943, comments: 13, categories: ['Web'], uploadDate: '2025-06-11T00:00:00' },
  { id: 26, title: '1인 개발자 일기', authorId: 10, likes: 3, views: 995, comments: 2, categories: ['App', 'UI/UX', 'Web'], uploadDate: '2025-06-15T00:00:00' },
  { id: 27, title: '인기 웹툰 모음집', authorId: 16, likes: 64, views: 830, comments: 12, categories: ['Blockchain', 'Game', 'App'], uploadDate: '2025-06-09T00:00:00' },
  { id: 28, title: '게임 랭킹 차트 뷰어', authorId: 1, likes: 64, views: 476, comments: 2, categories: ['Blockchain', 'App', 'Web'], uploadDate: '2025-06-27T00:00:00' },
  { id: 29, title: '책 읽는 습관 도우미', authorId: 5, likes: 73, views: 719, comments: 20, categories: ['Web', 'UI/UX'], uploadDate: '2025-06-17T00:00:00' },
  { id: 30, title: '개발자 밈 아카이브', authorId: 8, likes: 28, views: 285, comments: 6, categories: ['App', 'Blockchain', 'UI/UX'], uploadDate: '2025-06-20T00:00:00' },
  { id: 31, title: '커플 일정 맞추기 앱', authorId: 10, likes: 36, views: 730, comments: 6, categories: ['AI/ML'], uploadDate: '2025-06-05T00:00:00' },
  { id: 32, title: '밤하늘 별자리 보기', authorId: 9, likes: 7, views: 797, comments: 17, categories: ['Game'], uploadDate: '2025-06-03T00:00:00' },
  { id: 33, title: '여행 루트 자동 생성기', authorId: 6, likes: 35, views: 154, comments: 14, categories: ['AI/ML', 'Web', 'App'], uploadDate: '2025-06-25T00:00:00' },
  { id: 34, title: '심심할 때 퀴즈 앱', authorId: 15, likes: 80, views: 336, comments: 11, categories: ['Blockchain'], uploadDate: '2025-06-09T00:00:00' },
  { id: 35, title: '공부 시간 타이머', authorId: 5, likes: 31, views: 596, comments: 8, categories: ['Game', 'Web', 'App'], uploadDate: '2025-06-27T00:00:00' },
  { id: 36, title: 'NFT 마켓플레이스 클론', authorId: 9, likes: 4, views: 819, comments: 20, categories: ['Game', 'App', 'Blockchain'], uploadDate: '2025-06-08T00:00:00' },
  { id: 37, title: '블록체인 투표 시스템', authorId: 9, likes: 23, views: 578, comments: 5, categories: ['Web'], uploadDate: '2025-06-26T00:00:00' },
  { id: 38, title: '암호화폐 포트폴리오 추적기', authorId: 4, likes: 76, views: 908, comments: 14, categories: ['Game', 'UI/UX'], uploadDate: '2025-06-15T00:00:00' },
  { id: 39, title: '스마트 계약 배포 도구', authorId: 13, likes: 99, views: 935, comments: 11, categories: ['App'], uploadDate: '2025-06-05T00:00:00' },
  { id: 40, title: '블록체인 기반 토큰 발행기', authorId: 1, likes: 3, views: 858, comments: 6, categories: ['App', 'Game', 'AI/ML'], uploadDate: '2025-06-29T00:00:00' },
  { id: 41, title: 'DAO 커뮤니티 관리 앱', authorId: 9, likes: 38, views: 499, comments: 4, categories: ['UI/UX', 'Blockchain'], uploadDate: '2025-06-18T00:00:00' },
  { id: 42, title: 'AI 얼굴 인식 출석부', authorId: 8, likes: 45, views: 712, comments: 9, categories: ['AI/ML', 'Web'], uploadDate: '2025-06-30T00:00:00' },
{ id: 43, title: '음식 추천 챗봇', authorId: 7, likes: 67, views: 456, comments: 6, categories: ['AI/ML', 'App'], uploadDate: '2025-07-01T00:00:00' },
{ id: 44, title: '투두 리스트 with 다크모드', authorId: 2, likes: 88, views: 612, comments: 10, categories: ['Web', 'UI/UX'], uploadDate: '2025-06-28T00:00:00' },
{ id: 45, title: 'VR 미술 전시 체험', authorId: 11, likes: 53, views: 820, comments: 12, categories: ['Game', 'UI/UX'], uploadDate: '2025-06-27T00:00:00' },
{ id: 46, title: '모바일 헬스케어 기록 앱', authorId: 10, likes: 61, views: 399, comments: 5, categories: ['App', 'UI/UX'], uploadDate: '2025-06-24T00:00:00' },
{ id: 47, title: '방탈출 게임 웹버전', authorId: 6, likes: 48, views: 980, comments: 15, categories: ['Game', 'Web'], uploadDate: '2025-07-02T00:00:00' },
{ id: 48, title: '리액트 기반 뉴스 피드 앱', authorId: 3, likes: 34, views: 287, comments: 4, categories: ['Web', 'App'], uploadDate: '2025-06-30T00:00:00' },
{ id: 49, title: 'AI 글쓰기 도우미', authorId: 5, likes: 72, views: 544, comments: 8, categories: ['AI/ML', 'UI/UX'], uploadDate: '2025-06-29T00:00:00' },
{ id: 50, title: '심리테스트 웹 앱', authorId: 14, likes: 95, views: 776, comments: 13, categories: ['Web', 'App'], uploadDate: '2025-06-22T00:00:00' },
{ id: 51, title: '날씨 기반 옷차림 추천기', authorId: 12, likes: 30, views: 214, comments: 3, categories: ['AI/ML', 'Web'], uploadDate: '2025-07-03T00:00:00' },
{ id: 52, title: '음악 감정 분석 추천 앱', authorId: 7, likes: 86, views: 903, comments: 17, categories: ['AI/ML', 'App'], uploadDate: '2025-06-25T00:00:00' },
{ id: 53, title: '캘린더 일정 공유 앱', authorId: 9, likes: 41, views: 327, comments: 6, categories: ['App', 'Web'], uploadDate: '2025-06-21T00:00:00' },
{ id: 54, title: 'AI 코드 리뷰 시스템', authorId: 1, likes: 78, views: 1003, comments: 22, categories: ['AI/ML', 'Web'], uploadDate: '2025-07-04T00:00:00' },
{ id: 55, title: '독서 기록 + 서평 플랫폼', authorId: 6, likes: 65, views: 560, comments: 9, categories: ['Web', 'UI/UX'], uploadDate: '2025-07-05T00:00:00' },
{ id: 56, title: '전자책 공유 클라우드 서비스', authorId: 13, likes: 49, views: 720, comments: 5, categories: ['Web'], uploadDate: '2025-07-02T00:00:00' },
{ id: 57, title: '블록체인 출석체크 시스템', authorId: 8, likes: 36, views: 456, comments: 4, categories: ['Blockchain'], uploadDate: '2025-07-06T00:00:00' },
{ id: 58, title: '영상 자동 자막 생성기', authorId: 10, likes: 99, views: 1105, comments: 21, categories: ['AI/ML', 'App'], uploadDate: '2025-06-20T00:00:00' },
{ id: 59, title: '다국어 번역 챗봇', authorId: 15, likes: 55, views: 392, comments: 6, categories: ['AI/ML', 'Web'], uploadDate: '2025-07-01T00:00:00' },
{ id: 60, title: '모임 일정 조율 플랫폼', authorId: 2, likes: 27, views: 251, comments: 3, categories: ['App'], uploadDate: '2025-07-05T00:00:00' },
{ id: 61, title: '여행 리뷰 공유 SNS', authorId: 4, likes: 64, views: 713, comments: 11, categories: ['Web', 'UI/UX'], uploadDate: '2025-07-04T00:00:00' },
{ id: 62, title: 'AI 포토 리터칭 툴', authorId: 11, likes: 89, views: 964, comments: 16, categories: ['AI/ML', 'App'], uploadDate: '2025-06-23T00:00:00' },
{ id: 63, title: '블록체인 기반 게임 아이템 거래소', authorId: 6, likes: 78, views: 1203, comments: 18, categories: ['Game', 'Blockchain'], uploadDate: '2025-07-06T00:00:00' },
{ id: 64, title: '가위바위보 NFT 게임', authorId: 3, likes: 42, views: 867, comments: 9, categories: ['Game', 'Blockchain'], uploadDate: '2025-07-07T00:00:00' },
{ id: 65, title: '보드게임 토큰화 서비스', authorId: 9, likes: 55, views: 743, comments: 6, categories: ['Blockchain', 'Game'], uploadDate: '2025-07-08T00:00:00' },
{ id: 66, title: '메타버스 RPG with 코인', authorId: 12, likes: 84, views: 1422, comments: 22, categories: ['Game', 'Blockchain', 'UI/UX'], uploadDate: '2025-07-06T00:00:00' },
{ id: 67, title: 'NFT 기반 카드 배틀 게임', authorId: 15, likes: 61, views: 1009, comments: 13, categories: ['Game', 'Blockchain'], uploadDate: '2025-07-09T00:00:00' },
{ id: 68, title: '코인 수익 시뮬레이션 게임', authorId: 2, likes: 70, views: 880, comments: 10, categories: ['Game', 'Blockchain'], uploadDate: '2025-07-05T00:00:00' },
{ id: 69, title: '블록체인 경마 예측 게임', authorId: 11, likes: 47, views: 756, comments: 8, categories: ['Blockchain', 'Game'], uploadDate: '2025-07-10T00:00:00' },
{ id: 70, title: '온라인 주사위 게임 with NFT', authorId: 8, likes: 39, views: 688, comments: 5, categories: ['Game', 'Blockchain'], uploadDate: '2025-07-11T00:00:00' },
{ id: 71, title: '코인 캐치 미니게임', authorId: 5, likes: 52, views: 732, comments: 7, categories: ['Game', 'Blockchain'], uploadDate: '2025-07-12T00:00:00' },
{ id: 72, title: '탈중앙 게임 리워드 시스템', authorId: 10, likes: 91, views: 1111, comments: 14, categories: ['Blockchain', 'Game'], uploadDate: '2025-07-13T00:00:00' },
];
