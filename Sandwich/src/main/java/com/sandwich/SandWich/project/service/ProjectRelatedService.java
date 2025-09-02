package com.sandwich.SandWich.project.service;


import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.dto.ProjectCarouselItemResponse;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectRelatedService {

    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProjectCarouselItemResponse> getAuthorOthers(Long projectId, int size) {
        // 1) 기준 프로젝트 → 작성자 찾기
        Project base = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다."));

        Long authorId = base.getUser().getId();
        int pageSize = (size <= 0 || size > 30) ? 12 : size; // 안전 상한

        // 2) 같은 작성자의 다른 프로젝트 최신순 조회 (현재 프로젝트 제외)
        Pageable topN = PageRequest.of(0, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Project> rows = projectRepository.findAuthorOthersByLatest(authorId, projectId, topN);

        // 3) PageResponse로 감싸기(캐러셀이라도 재사용 위해 페이지 형태 유지)
        Page<ProjectCarouselItemResponse> page =
                new PageImpl<>(rows.stream().map(ProjectCarouselItemResponse::new).toList(), topN, rows.size());

        return PageResponse.of(page);
    }
}