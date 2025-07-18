package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.common.util.QRCodeGenerator;
import com.sandwich.SandWich.global.exception.exceptiontype.ForbiddenException;
import com.sandwich.SandWich.global.exception.exceptiontype.ProjectNotFoundException;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.domain.ProjectContent;
import com.sandwich.SandWich.project.dto.*;
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

    @Transactional
    public void deleteProject(Long id, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException("존재하지 않는 프로젝트입니다."));

        if (!project.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("본인의 프로젝트만 삭제할 수 있습니다.");
        }

        project.setDeleted(true);
        projectRepository.save(project);  // 소프트 삭제 처리
    }

    @Transactional
    public void updateProject(Long id, ProjectPatchRequest request, User user) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> {
                    System.out.println("[LOG] 프로젝트가 존재하지 않음");
                    return new ProjectNotFoundException("프로젝트가 존재하지 않습니다.");
                });

        System.out.println("[LOG] 로그인 유저: " + user.getId());
        System.out.println("[LOG] 작성자 유저: " + project.getUser().getId());

        if (!project.getUser().getId().equals(user.getId())) {
            System.out.println("[LOG] 권한 없음!");
            throw new ForbiddenException("수정 권한이 없습니다.");
        }

        // Partial Update 처리 (null 아닌 필드만 반영)
        if (request.getTitle() != null) project.setTitle(request.getTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getTools() != null) project.setTools(request.getTools());
        if (request.getFrontendBuildCommand() != null) project.setFrontendBuildCommand(request.getFrontendBuildCommand());
        if (request.getBackendBuildCommand() != null) project.setBackendBuildCommand(request.getBackendBuildCommand());
        if (request.getPortNumber() != null) project.setPortNumber(request.getPortNumber());
        if (request.getSnsUrl() != null) project.setSnsUrl(request.getSnsUrl());

        // 콘텐츠 수정 처리: 전체 교체 방식 (or 다른 방식도 가능)
        if (request.getContents() != null) {
            project.getContents().clear();
            for (ProjectContentRequest contentReq : request.getContents()) {
                ProjectContent content = new ProjectContent();
                content.setType(contentReq.getType());
                content.setValue(contentReq.getValue());
                content.setContentOrder(contentReq.getOrder());
                content.setProject(project);
                project.getContents().add(content);
            }
        }
    }
}
