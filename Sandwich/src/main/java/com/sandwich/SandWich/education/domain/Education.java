package com.sandwich.SandWich.education.domain;

import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Education {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String schoolName;
    private String degree; // 학사, 석사 등
    private Integer startYear;
    private Integer startMonth;
    private Integer endYear;
    private Integer endMonth;
    private String description;
    private boolean isRepresentative;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    public Education(String schoolName, String degree, Integer startYear, Integer startMonth,
                     Integer endYear, Integer endMonth, String description,
                     boolean isRepresentative, User user) {
        this.schoolName = schoolName;
        this.degree = degree;
        this.startYear = startYear;
        this.startMonth = startMonth;
        this.endYear = endYear;
        this.endMonth = endMonth;
        this.description = description;
        this.isRepresentative = isRepresentative;
        this.user = user;
    }

    public void update(String schoolName, String degree, Integer startYear, Integer startMonth,
                       Integer endYear, Integer endMonth, String description,
                       boolean isRepresentative) {
        this.schoolName = schoolName;
        this.degree = degree;
        this.startYear = startYear;
        this.startMonth = startMonth;
        this.endYear = endYear;
        this.endMonth = endMonth;
        this.description = description;
        this.isRepresentative = isRepresentative;
    }

    public void toggleRepresentative() {
        this.isRepresentative = !this.isRepresentative;
    }
}
