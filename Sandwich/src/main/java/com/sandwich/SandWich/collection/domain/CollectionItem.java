package com.sandwich.SandWich.collection.domain;
import com.sandwich.SandWich.common.domain.BaseEntity;
import com.sandwich.SandWich.project.domain.Project;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@Entity
public class CollectionItem extends BaseEntity {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private CollectionFolder folder;

    @ManyToOne(fetch = FetchType.LAZY)
    private Project project;
}