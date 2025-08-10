package com.sandwich.SandWich.collection.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RemoveFromCollectionRequest {
    private Long projectId;
    private Long folderId;
}
