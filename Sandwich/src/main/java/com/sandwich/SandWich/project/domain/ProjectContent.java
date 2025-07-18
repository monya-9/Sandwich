package com.sandwich.SandWich.project.domain;
import jakarta.persistence.*;

// 프로젝트에 연결된 이미지/텍스트/영상 콘텐츠를 순서대로 저장하는 서브 엔티티
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class ProjectContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private ContentType type; // IMAGE, TEXT, VIDEO

    @Column(columnDefinition = "TEXT")
    private String value; // 텍스트 내용 or S3 URL

    private int contentOrder; // 콘텐츠 순서

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;


}