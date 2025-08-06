package com.sandwich.SandWich.award.domain;

import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Award {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;           // 수상 제목
    private String issuer;          // 수여 기관
    private Integer year;           // 수상 연도
    private Integer month;          // 수상 월
    private String description;     // 상세 내용

    private boolean isRepresentative;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    public Award(String title, String issuer, Integer year, Integer month,
                 String description, boolean isRepresentative, User user) {
        this.title = title;
        this.issuer = issuer;
        this.year = year;
        this.month = month;
        this.description = description;
        this.isRepresentative = isRepresentative;
        this.user = user;
    }

    public void update(String title, String issuer, Integer year, Integer month,
                       String description, boolean isRepresentative) {
        this.title = title;
        this.issuer = issuer;
        this.year = year;
        this.month = month;
        this.description = description;
        this.isRepresentative = isRepresentative;
    }

    public void toggleRepresentative() {
        this.isRepresentative = !this.isRepresentative;
    }
}
