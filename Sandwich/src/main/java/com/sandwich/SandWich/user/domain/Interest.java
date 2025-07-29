package com.sandwich.SandWich.user.domain;
import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
public class Interest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

//    @Enumerated(EnumType.STRING)
//    @Column(nullable = false)
//    private InterestType type;
}