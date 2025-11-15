package com.sandwich.SandWich.project.service;

import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.common.util.QRCodeGenerator;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.dto.ProjectDetailResponse;
import com.sandwich.SandWich.project.dto.ProjectListItemResponse;
import com.sandwich.SandWich.project.dto.ProjectRequest;
import com.sandwich.SandWich.project.dto.ProjectResponse;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.project.repository.ProjectSpecs;
import com.sandwich.SandWich.project.support.UploadWindow;
import com.sandwich.SandWich.reward.service.CreditUseService;
import com.sandwich.SandWich.social.repository.FollowRepository;
import com.sandwich.SandWich.upload.util.S3Uploader;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final S3Uploader s3Uploader;
    private final FollowRepository followRepository;
    private final Clock clock;
    private final CreditUseService creditUseService;

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    // 배포 기능 1회 ON 시 차감 크레딧
    private static final long PROJECT_DEPLOY_COST = 10_000L;
    private static final String REASON_SPEND_PROJECT_DEPLOY = "SPEND_PROJECT_DEPLOY";

    // 공유 URL 도메인 (dev / prod 환경에 따라 변경 가능)
    private static final String SHARE_BASE_URL = "https://sandwich-dev.com";

    // 데모(배포) URL 도메인 (CloudFront)
    private static final String DEMO_BASE_URL = "https://d11ngnf9bl79gb.cloudfront.net";

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, User user) {
        Project project = new Project();
        project.setUser(user);
        project.setTitle(request.getTitle());
        project.setDescription(request.getDescription());
        project.setImage(request.getImage());
        project.setTools(request.getTools());
        project.setRepositoryUrl(request.getRepositoryUrl());

        project.setDemoUrl(null);

        project.setStartYear(request.getStartYear());
        project.setEndYear(request.getEndYear());
        project.setIsTeam(request.getIsTeam());
        project.setTeamSize(request.getTeamSize());
        project.setCoverUrl(request.getCoverUrl());
        project.setQrCodeEnabled(request.getQrCodeEnabled());
        project.setFrontendBuildCommand(request.getFrontendBuildCommand());
        project.setBackendBuildCommand(request.getBackendBuildCommand());
        project.setPortNumber(request.getPortNumber());
        project.setExtraRepoUrl(request.getExtraRepoUrl());

        // 배포 여부 플래그
        Boolean deployEnabled = (request.getDeployEnabled() != null && request.getDeployEnabled());
        project.setDeployEnabled(deployEnabled);

        // 1차 저장
        Project saved = projectRepository.save(project);

        // --- 공유 URL (SandWich 상세 페이지) 생성 ---
        String shareUrl = SHARE_BASE_URL + "/" + user.getUsername() + "/" + saved.getId();
        saved.setShareUrl(shareUrl);

        // --- 배포가 ON이면 demoUrl도 서버에서 생성 ---
        if (Boolean.TRUE.equals(deployEnabled)) {
            String demoUrl = buildDemoUrl(user, saved);
            saved.setDemoUrl(demoUrl);
            log.info("[DEMO_URL][CREATE] projectId={} demoUrl={}", saved.getId(), demoUrl);
        }

        // --- 정책 검증 1: deployEnabled=false 인데 qrCodeEnabled=true 이면 금지 ---
        if (Boolean.TRUE.equals(request.getQrCodeEnabled()) && !Boolean.TRUE.equals(deployEnabled)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "qrCodeEnabled=true requires deployEnabled=true"
            );
        }

        // --- QR 생성 정책 ---
        // QR은 "배포 ON + qrCodeEnabled=true + demoUrl 존재"일 때만 생성
        if (Boolean.TRUE.equals(deployEnabled) && Boolean.TRUE.equals(request.getQrCodeEnabled())) {

            String demoUrl = saved.getDemoUrl();
            if (demoUrl == null || demoUrl.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "qrCodeEnabled=true requires demoUrl to be present"
                );
            }

            log.info("[QR 생성][CREATE] demoUrl 기반 - {}", demoUrl);
            byte[] qrImage = QRCodeGenerator.generateQRCodeImage(demoUrl, 300, 300);
            String qrImageUrl = s3Uploader.uploadQrImage(qrImage);
            saved.setQrImageUrl(qrImageUrl);
            log.info("[QR 업로드][CREATE] projectId={} S3 URL={}", saved.getId(), qrImageUrl);
        }

        // --- 크레딧 차감 정책 ---
        // 배포가 켜진 상태로 생성되면, 이 시점에서 10,000 크레딧 사용
        if (Boolean.TRUE.equals(deployEnabled)) {
            long remaining = creditUseService.useCredits(
                    user.getId(),
                    PROJECT_DEPLOY_COST,
                    REASON_SPEND_PROJECT_DEPLOY,
                    saved.getId() // refId → 프로젝트 ID로 연결
            );
            log.info("[CREDIT][CREATE] user={} project={} 배포 비용 {} 사용 후 잔액={}",
                    user.getId(), saved.getId(), PROJECT_DEPLOY_COST, remaining);
        }

        // 다시 저장 (shareUrl + demoUrl + qrImageUrl 포함)
        projectRepository.save(saved);

        return new ProjectResponse(saved.getId(), shareUrl);
    }

    /**
     * DevOps랑 약속된 규칙으로 demoUrl 생성
     * 지금은 예시로 userId/projectId/index.html 로 구성해둠.
     * 실제 규칙에 맞게 내부만 바꾸면 됨.
     */
    private String buildDemoUrl(User user, Project project) {
        Long userId = user.getId();
        Long projectId = project.getId();
        return DEMO_BASE_URL + "/" + userId + "/" + projectId + "/index.html";
    }

    @Transactional(readOnly = true)
    public ProjectDetailResponse getProjectByUserIdAndProjectId(Long userId, Long id) {
        Project project = projectRepository.findByIdAndUserId(id, userId)
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
                .shareUrl(project.getShareUrl())
                .qrCodeEnabled(project.getQrCodeEnabled())
                .deployEnabled(project.getDeployEnabled())
                .qrImageUrl(project.getQrImageUrl())
                .frontendBuildCommand(project.getFrontendBuildCommand())
                .backendBuildCommand(project.getBackendBuildCommand())
                .portNumber(project.getPortNumber())
                .extraRepoUrl(project.getExtraRepoUrl())
                .owner(project.getUser() != null ? new ProjectDetailResponse.Owner(project.getUser()) : null)
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectListItemResponse> findAllProjects(Pageable pageable) {
        Page<Project> page = projectRepository.findAllByOrderByCreatedAtDesc(pageable);
        Page<ProjectListItemResponse> mapped = page.map(ProjectListItemResponse::new);
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectListItemResponse> findAllProjects(
            String q,
            UploadWindow uploadedWithin,
            boolean followingOnly,
            Long currentUserId,
            Pageable pageable
    ) {
        Specification<Project> spec = Specification.where(ProjectSpecs.always());

        if (uploadedWithin != null) {
            spec = spec.and(ProjectSpecs.createdAfter(uploadedWithin.since(clock)));
        }
        if (q != null && !q.isBlank()) {
            spec = spec.and(ProjectSpecs.keywordLike(q));
        }
        if (followingOnly) {
            if (currentUserId == null) {
                throw new IllegalStateException("Login required for followingOnly=true");
            }
            Set<Long> followingIds = followRepository.findFollowingUserIds(currentUserId);
            if (followingIds.isEmpty()) {
                Page<Project> empty = Page.empty(pageable);
                Page<ProjectListItemResponse> mappedEmpty = empty.map(ProjectListItemResponse::new);
                return PageResponse.of(mappedEmpty);
            }
            spec = spec.and(ProjectSpecs.authorIn(followingIds));
        }

        Pageable byLatest = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Project> page = projectRepository.findAll(spec, byLatest);
        Page<ProjectListItemResponse> mapped = page.map(ProjectListItemResponse::new);
        return PageResponse.of(mapped);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectListItemResponse> findProjectsByAuthor(Long authorId, Pageable pageable) {
        Specification<Project> spec = Specification.where(ProjectSpecs.always())
                .and(ProjectSpecs.authorIn(java.util.Set.of(authorId)));

        Pageable byLatest = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Project> page = projectRepository.findAll(spec, byLatest);
        Page<ProjectListItemResponse> mapped = page.map(ProjectListItemResponse::new);
        return PageResponse.of(mapped);
    }

    @Transactional
    public void updateProject(Long userId, Long id, ProjectRequest request, User actor) {
        Project project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 프로젝트입니다."));
        if (!project.getUser().getId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다.");
        }

        Boolean beforeDeployEnabled = project.getDeployEnabled();

        project.setTitle(request.getTitle());
        project.setDescription(request.getDescription());
        project.setImage(request.getImage());
        project.setTools(request.getTools());
        project.setRepositoryUrl(request.getRepositoryUrl());

        // demoUrl도 이제는 서버가 관리 → 요청 값은 무시
        project.setStartYear(request.getStartYear());
        project.setEndYear(request.getEndYear());
        project.setIsTeam(request.getIsTeam());
        project.setTeamSize(request.getTeamSize());
        project.setCoverUrl(request.getCoverUrl());
        project.setQrCodeEnabled(request.getQrCodeEnabled());
        project.setFrontendBuildCommand(request.getFrontendBuildCommand());
        project.setBackendBuildCommand(request.getBackendBuildCommand());
        project.setPortNumber(request.getPortNumber());
        project.setExtraRepoUrl(request.getExtraRepoUrl());

        Boolean afterDeployEnabled =
                request.getDeployEnabled() != null && request.getDeployEnabled();
        project.setDeployEnabled(afterDeployEnabled);

        // 배포가 새로 켜지는 순간 demoUrl 생성
        boolean wasDisabled = (beforeDeployEnabled == null || !beforeDeployEnabled);
        boolean nowEnabled = Boolean.TRUE.equals(afterDeployEnabled);

        if (nowEnabled && (wasDisabled || project.getDemoUrl() == null)) {
            String demoUrl = buildDemoUrl(actor, project);
            project.setDemoUrl(demoUrl);
            log.info("[DEMO_URL][UPDATE] projectId={} demoUrl={}", project.getId(), demoUrl);
        }

        // deploy=false 인데 qr=true → 금지
        if (Boolean.TRUE.equals(project.getQrCodeEnabled()) && !Boolean.TRUE.equals(project.getDeployEnabled())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "qrCodeEnabled=true requires deployEnabled=true"
            );
        }

        // QR 생성/갱신: 배포 ON + qrCodeEnabled = true + demoUrl 존재
        if (Boolean.TRUE.equals(project.getDeployEnabled()) && Boolean.TRUE.equals(project.getQrCodeEnabled())) {
            String demoUrl = project.getDemoUrl();
            if (demoUrl == null || demoUrl.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "qrCodeEnabled=true requires demoUrl to be present"
                );
            }

            log.info("[QR 생성][UPDATE] projectId={} demoUrl={}", project.getId(), demoUrl);
            byte[] qrImage = QRCodeGenerator.generateQRCodeImage(demoUrl, 300, 300);
            String qrImageUrl = s3Uploader.uploadQrImage(qrImage);
            project.setQrImageUrl(qrImageUrl);
            log.info("[QR 업로드][UPDATE] projectId={} S3 URL={}", project.getId(), qrImageUrl);
        }

        projectRepository.save(project);

        // 크레딧: before=false/null → after=true 인 시점에만 차감
        if (wasDisabled && nowEnabled) {
            long remaining = creditUseService.useCredits(
                    actor.getId(),
                    PROJECT_DEPLOY_COST,
                    REASON_SPEND_PROJECT_DEPLOY,
                    project.getId()
            );
            log.info("[CREDIT][UPDATE] user={} project={} 배포 ON 비용 {} 사용 후 잔액={}",
                    actor.getId(), project.getId(), PROJECT_DEPLOY_COST, remaining);
        }
    }

    @Transactional
    public void deleteProject(Long userId, Long id, User actor) {
        Project project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 프로젝트입니다."));
        if (!project.getUser().getId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "권한이 없습니다.");
        }
        projectRepository.delete(project);
    }
}
