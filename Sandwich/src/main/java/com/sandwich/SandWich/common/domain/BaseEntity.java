package com.sandwich.SandWich.common.domain;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

// 모든 Entity에 공통으로 들어가는 필드를 BaseEntity 부모 클래스로 분리
@MappedSuperclass
@Getter @Setter
public abstract class BaseEntity {

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
