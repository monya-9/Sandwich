package com.sandwich.SandWich.collection.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CollectionFolderRequest {
    private String title;
    private String description;

    @JsonProperty("isPrivate")
    private boolean isPrivate;

}

