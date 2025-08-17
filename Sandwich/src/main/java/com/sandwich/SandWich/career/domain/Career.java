package com.sandwich.SandWich.career.domain;

import com.sandwich.SandWich.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Career {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String role;
    private String companyName;
    private Integer startYear;
    private Integer startMonth;
    private Integer endYear;
    private Integer endMonth;
    private boolean isWorking;
    private String description;
    private boolean isRepresentative;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    public Career(String role, String companyName, Integer startYear, Integer startMonth,
                  Integer endYear, Integer endMonth, boolean isWorking,
                  String description, boolean isRepresentative, User user) {
        this.role = role;
        this.companyName = companyName;
        this.startYear = startYear;
        this.startMonth = startMonth;
        this.endYear = endYear;
        this.endMonth = endMonth;
        this.isWorking = isWorking;
        this.description = description;
        this.isRepresentative = isRepresentative;
        this.user = user;
    }

    public void update(String role, String companyName, Integer startYear, Integer startMonth,
                       Integer endYear, Integer endMonth, boolean isWorking,
                       String description, boolean isRepresentative) {
        this.role = role;
        this.companyName = companyName;
        this.startYear = startYear;
        this.startMonth = startMonth;
        this.endYear = endYear;
        this.endMonth = endMonth;
        this.isWorking = isWorking;
        this.description = description;
        this.isRepresentative = isRepresentative;
    }

    public void toggleRepresentative() {
        this.isRepresentative = !this.isRepresentative;
    }
}
