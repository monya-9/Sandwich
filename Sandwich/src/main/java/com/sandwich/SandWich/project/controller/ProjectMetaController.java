package com.sandwich.SandWich.project.controller;

import com.sandwich.SandWich.project.service.ProjectMetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects/meta")
public class ProjectMetaController {
    private final ProjectMetaService metaService;

    @GetMapping("/summary")
    public java.util.Map<Long, com.sandwich.SandWich.project.dto.ProjectMetaSummary> summary(
            @RequestParam("ids") String idsParam
    ) {
        var ids = java.util.Arrays.stream(idsParam.split(","))
                .map(String::trim).filter(s -> !s.isBlank())
                .map(Long::valueOf).toList();
        return metaService.summary(ids);
    }
}