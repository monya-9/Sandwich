package com.sandwich.SandWich.careerProject.domain;


import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CareerProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String techStack;
    private String role;
    private Integer startYear;
    private Integer startMonth;
    private Integer endYear;
    private Integer endMonth;
    private String description;

    private boolean isRepresentative;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    public CareerProject(String title, String techStack, String role,
                         Integer startYear, Integer startMonth,
                         Integer endYear, Integer endMonth,
                         String description, boolean isRepresentative, User user) {
        this.title = title;
        this.techStack = techStack;
        this.role = role;
        this.startYear = startYear;
        this.startMonth = startMonth;
        this.endYear = endYear;
        this.endMonth = endMonth;
        this.description = description;
        this.isRepresentative = isRepresentative;
        this.user = user;
    }

    public void update(String title, String techStack, String role,
                       Integer startYear, Integer startMonth,
                       Integer endYear, Integer endMonth,
                       String description, boolean isRepresentative) {
        this.title = title;
        this.techStack = techStack;
        this.role = role;
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