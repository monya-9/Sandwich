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
public class AddToCollectionRequest {
    private Long projectId;
    private List<Long> folderIds;
}