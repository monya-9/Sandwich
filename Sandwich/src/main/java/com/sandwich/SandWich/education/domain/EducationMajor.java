package com.sandwich.SandWich.education.domain;

import com.sandwich.SandWich.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class EducationMajor extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "education_id", nullable = false)
    private Education education;

    @Column(nullable = false, length = 255)
    private String name;

    public EducationMajor(Education education, String name) {
        this.education = education;
        this.name = name;
    }
}