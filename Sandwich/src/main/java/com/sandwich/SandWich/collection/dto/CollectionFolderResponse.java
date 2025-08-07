package com.sandwich.SandWich.collection.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CollectionFolderResponse {
    private Long id;
    private String title;
    private String description;
    private boolean isPrivate;
    private int projectCount;
}
