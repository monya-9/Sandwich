package com.sandwich.SandWich.collection.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CollectionFolderDetailResponse {
    private String title;
    private String description;
    private boolean isPrivate;
    private List<ProjectSummary> projects;
}