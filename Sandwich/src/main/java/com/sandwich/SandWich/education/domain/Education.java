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
    private String degree;

    @Enumerated(EnumType.STRING)
    private EducationLevel level;

    @Enumerated(EnumType.STRING)
    private EducationStatus status;
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
                     boolean isRepresentative, User user,
                     EducationLevel level, EducationStatus status) {
        this.schoolName = schoolName;
        this.degree = degree;
        this.startYear = startYear;
        this.startMonth = startMonth;
        this.endYear = endYear;
        this.endMonth = endMonth;
        this.description = description;
        this.isRepresentative = isRepresentative;
        this.user = user;
        this.level = level;
        this.status = status;
    }

    public void update(String schoolName, String degree, Integer startYear, Integer startMonth,
                       Integer endYear, Integer endMonth, String description,
                       boolean isRepresentative, EducationLevel level, EducationStatus status) {
        this.schoolName = schoolName;
        this.degree = degree;
        this.startYear = startYear;
        this.startMonth = startMonth;
        this.endYear = endYear;
        this.endMonth = endMonth;
        this.description = description;
        this.isRepresentative = isRepresentative;
        this.level = level;
        this.status = status;
    }

    public void toggleRepresentative() {
        this.isRepresentative = !this.isRepresentative;
    }

    public void setRepresentative(boolean value) {
        this.isRepresentative = value;
    }
}
