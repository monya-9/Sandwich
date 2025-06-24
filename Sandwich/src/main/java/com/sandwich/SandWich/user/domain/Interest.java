package com.sandwich.SandWich.user.domain;
import jakarta.persistence.*;

@Entity
public class Interest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
}