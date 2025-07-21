package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.common.util.QRCodeGenerator;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.dto.ProjectDetailResponse;
import com.sandwich.SandWich.project.dto.ProjectListItemResponse;
import com.sandwich.SandWich.project.dto.ProjectRequest;
import com.sandwich.SandWich.project.dto.ProjectResponse;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.upload.util.S3Uploader;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final S3Uploader s3Uploader;
    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, User user) {
        Project project = new Project();
        project.setUser(user);
        project.setTitle(request.getTitle());
        project.setDescription(request.getDescription());
        project.setImage(request.getImage());
        project.setTools(request.getTools());
        project.setRepositoryUrl(request.getRepositoryUrl());
        project.setDemoUrl(request.getDemoUrl());
        project.setStartYear(request.getStartYear());
        project.setEndYear(request.getEndYear());
        project.setIsTeam(request.getIsTeam());
        project.setTeamSize(request.getTeamSize());
        project.setCoverUrl(request.getCoverUrl());
        project.setSnsUrl(request.getSnsUrl());
        project.setQrCodeEnabled(request.getQrCodeEnabled());
        project.setFrontendBuildCommand(request.getFrontendBuildCommand());
        project.setBackendBuildCommand(request.getBackendBuildCommand());
        project.setPortNumber(request.getPortNumber());
        project.setExtraRepoUrl(request.getExtraRepoUrl());

        // 1차 저장
        Project saved = projectRepository.save(project);

        // preview URL 구성
        // preview URL에 프로젝트 ID 포함
        String previewUrl = user.getUsername() + ".sandwich.com/projects/" + saved.getId();

        // QR 코드 생성 및 업로드 조건 체크
        if (request.getQrCodeEnabled() != null && request.getQrCodeEnabled()) {
            String qrTargetUrl = "https://" + previewUrl;
            log.info("[QR 생성] 시작 - previewUrl: {}", qrTargetUrl);
            byte[] qrImage = QRCodeGenerator.generateQRCodeImage(qrTargetUrl, 300, 300);
            log.info("[QR 생성] 완료 - {} 바이트", qrImage.length);
            String qrImageUrl = s3Uploader.uploadQrImage(qrImage);  // ⚠️ S3Uploader 주입 필요
            log.info("[QR 업로드] 완료 - S3 URL: {}", qrImageUrl);
            saved.setQrImageUrl(qrImageUrl);
        }

        return new ProjectResponse(saved.getId(), previewUrl);
    }

    @Transactional(readOnly = true)
    public ProjectDetailResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 프로젝트입니다."));

        return ProjectDetailResponse.builder()
                .projectId(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .image(project.getImage())
                .tools(project.getTools())
                .repositoryUrl(project.getRepositoryUrl())
                .demoUrl(project.getDemoUrl())
                .startYear(project.getStartYear())
                .endYear(project.getEndYear())
                .isTeam(project.getIsTeam())
                .teamSize(project.getTeamSize())
                .coverUrl(project.getCoverUrl())
                .snsUrl(project.getSnsUrl())
                .qrCodeEnabled(project.getQrCodeEnabled())
                .qrImageUrl(project.getQrImageUrl())
                .frontendBuildCommand(project.getFrontendBuildCommand())
                .backendBuildCommand(project.getBackendBuildCommand())
                .portNumber(project.getPortNumber())
                .extraRepoUrl(project.getExtraRepoUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectListItemResponse> findAllProjects(Pageable pageable) {
        Page<Project> page = projectRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PageResponse.of(page.map(ProjectListItemResponse::new));
    }
}
