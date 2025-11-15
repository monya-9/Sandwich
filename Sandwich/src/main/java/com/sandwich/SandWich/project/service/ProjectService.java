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

        // 공유 URL (SandWich 상세 페이지) 생성
        String previewUrl = SHARE_BASE_URL + "/" + user.getUsername() + "/" + saved.getId();
        saved.setShareUrl(previewUrl);

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

        // 다시 저장 (shareUrl + qrImageUrl 포함)
        projectRepository.save(saved);

        return new ProjectResponse(saved.getId(), previewUrl);
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

    // 필터/팔로우/검색 대응 (정렬 최신순 고정)
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

        // 배포 ON/OFF 토글 감지용
        Boolean beforeDeployEnabled = project.getDeployEnabled();

        // 필드 업데이트
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
        project.setQrCodeEnabled(request.getQrCodeEnabled());
        project.setFrontendBuildCommand(request.getFrontendBuildCommand());
        project.setBackendBuildCommand(request.getBackendBuildCommand());
        project.setPortNumber(request.getPortNumber());
        project.setExtraRepoUrl(request.getExtraRepoUrl());

        Boolean afterDeployEnabled =
                request.getDeployEnabled() != null && request.getDeployEnabled();
        project.setDeployEnabled(afterDeployEnabled);

        // --- 정책 검증 1: deployEnabled=false 인데 qrCodeEnabled=true 인 경우 방지 ---
        if (Boolean.TRUE.equals(project.getQrCodeEnabled()) && !Boolean.TRUE.equals(project.getDeployEnabled())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "qrCodeEnabled=true requires deployEnabled=true"
            );
        }

        // --- QR 생성/갱신 정책 ---
        // 조건: 배포 ON + qrCodeEnabled = true + demoUrl 존재
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
        } else {
            // 선택: qrCodeEnabled=false 로 바꾼 경우 QR 이미지 제거하고 싶으면 사용
            // project.setQrImageUrl(null);
        }

        projectRepository.save(project);

        // --- 크레딧 차감 정책 ---
        // before=false/null → after=true 인 시점에만 10,000 차감
        boolean wasDisabled = (beforeDeployEnabled == null || !beforeDeployEnabled);
        boolean nowEnabled = Boolean.TRUE.equals(afterDeployEnabled);

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
        projectRepository.delete(project); // orphanRemoval=true 로 콘텐츠/뷰 등 함께 삭제
    }
}
