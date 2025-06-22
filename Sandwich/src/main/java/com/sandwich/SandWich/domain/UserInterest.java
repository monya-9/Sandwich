package com.sandwich.SandWich.domain;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class UserInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "interest_id")
    private Interest interest;

    // 직접 생성자
    public UserInterest(User user, Interest interest) {
        this.user = user;
        this.interest = interest;
    }
}