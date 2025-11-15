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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.Clock;
import java.util.Set;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final S3Uploader s3Uploader;
    private final FollowRepository followRepository;
    private final Clock clock;
    private final CreditUseService creditUseService;
    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);
    private static final long PROJECT_DEPLOY_COST = 10_000L;
    private static final String REASON_SPEND_PROJECT_DEPLOY = "SPEND_PROJECT_DEPLOY";

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
        project.setDeployEnabled(
                request.getDeployEnabled() != null && request.getDeployEnabled()
        );

        // 1차 저장
        Project saved = projectRepository.save(project);

        // 서버에서 공유 URL 생성 및 저장
        String previewUrl = "https://sandwich-dev.com/" + user.getUsername() + "/" + saved.getId();
        saved.setShareUrl(previewUrl);

        // QR 코드 생성 및 업로드 조건 체크
        if (request.getQrCodeEnabled() != null && request.getQrCodeEnabled()) {
            log.info("[QR 생성] 시작 - previewUrl: {}", previewUrl);
            byte[] qrImage = QRCodeGenerator.generateQRCodeImage(previewUrl, 300, 300);
            log.info("[QR 생성] 완료 - {} 바이트", qrImage.length);
            String qrImageUrl = s3Uploader.uploadQrImage(qrImage);  // ⚠️ S3Uploader 주입 필요
            saved.setQrImageUrl(qrImageUrl);
            log.info("[QR 업로드] 완료 - S3 URL: {}", qrImageUrl);
        }

        // 여기서 배포 기능 ON이면 크레딧 10,000 차감
        if (Boolean.TRUE.equals(request.getDeployEnabled())) {
            long remaining = creditUseService.useCredits(
                    user.getId(),
                    PROJECT_DEPLOY_COST,
                    REASON_SPEND_PROJECT_DEPLOY,
                    saved.getId() // refId → 프로젝트 ID 연결
            );
            log.info("[CREDIT] user={} project={} 배포 비용 {} 사용 후 잔액 = {}",
                    user.getId(), saved.getId(), PROJECT_DEPLOY_COST, remaining);
        }

        // 다시 저장 (공유 URL + QR 이미지 포함)
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
        Page<ProjectListItemResponse> mapped = page.map((Project p) -> new ProjectListItemResponse(p));
        return PageResponse.of(mapped);
    }

    // 신규: 필터/팔로우/검색 대응 (정렬 최신순 고정)
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
                Page<ProjectListItemResponse> mappedEmpty =
                        empty.map((Project p) -> new ProjectListItemResponse(p));
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
        Page<ProjectListItemResponse> mapped = page.map((Project p) -> new ProjectListItemResponse(p));
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
        Page<ProjectListItemResponse> mapped = page.map((Project p) -> new ProjectListItemResponse(p));
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

        // 새 배포 여부
        Boolean afterDeployEnabled =
                request.getDeployEnabled() != null && request.getDeployEnabled();
        project.setDeployEnabled(afterDeployEnabled);

        projectRepository.save(project);

        // 배포가 처음으로 켜지는 순간에만 10,000 차감
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
