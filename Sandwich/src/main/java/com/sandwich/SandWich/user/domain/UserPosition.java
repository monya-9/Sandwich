package com.sandwich.SandWich.user.domain;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class UserPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "position_id")
    private Position position;

    // 직접 생성자
    public UserPosition(User user, Position position) {
        this.user = user;
        this.position = position;
    }
}