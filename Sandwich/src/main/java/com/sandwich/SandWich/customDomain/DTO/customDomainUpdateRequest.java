package com.sandwich.SandWich.customDomain.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class customDomainUpdateRequest {
    private String customPath;
    private String realPath;
}
