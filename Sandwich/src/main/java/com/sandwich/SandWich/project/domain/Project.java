package com.sandwich.SandWich.project.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.challenge.domain.ChallengeOption;
import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.util.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Project extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // [제목 입력] 필드
    private String title;

    // [커버 이미지 업로드] - 이미지 파일 URL
    private String image;

    // [프로젝트 상세 설명] - 마크다운 입력
    private String description;

    // [기술 스택 선택] - 복수 선택 시 ',' 구분 저장되는 경우도 있음
    private String tools;

    // [GitHub URL] or [추가 소스코드 URL]
    private String repositoryUrl;

    // [라이브 데모 URL] (https://username.yoursite.com 형식)
    private String demoUrl;

    // [진행 기간 선택] - 시작 연도
    private Integer startYear;

    // [진행 기간 선택] - 종료 연도
    private Integer endYear;

    // [프로젝트 여부] - true: 팀 프로젝트 / false: 개인
    private Boolean isTeam;

    // [팀 구성원 수 선택]
    private Integer teamSize;

    // [커버 이미지 URL 저장용 - 실제 대표 이미지]
    private String coverUrl;

    // SNS 공유 링크
    private String snsUrl;

    // QR 코드 생성 여부
    private Boolean qrCodeEnabled;


    // 좋아요 기능 연동
    @OneToMany(mappedBy = "project")
    private List<Like> likes = new ArrayList<>();

    // 해시태그 기능 연동
    @OneToMany(mappedBy = "project")
    private List<Hashtag> hashtags = new ArrayList<>();

    // 인기 프로젝트 순위 집계용
    @OneToMany(mappedBy = "project")
    private List<ProjectRanking> rankings = new ArrayList<>();

    // 챌린지 모드 연결
    @OneToMany(mappedBy = "project")
    private List<ChallengeOption> challengeOptions = new ArrayList<>();

    // [에디터 콘텐츠] - 이미지/텍스트/영상 순서 저장
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectContent> contents = new ArrayList<>();
}