package com.sandwich.SandWich.collection.service;


import com.sandwich.SandWich.collection.domain.CollectionFolder;
import com.sandwich.SandWich.collection.domain.CollectionItem;
import com.sandwich.SandWich.collection.dto.*;
import com.sandwich.SandWich.common.exception.exceptiontype.CollectionFolderNotFoundException;
import com.sandwich.SandWich.common.exception.exceptiontype.ProjectNotFoundException;
import com.sandwich.SandWich.collection.repository.CollectionFolderRepository;
import com.sandwich.SandWich.collection.repository.CollectionItemRepository;

import com.sandwich.SandWich.comment.repository.CommentRepository;
import com.sandwich.SandWich.common.exception.exceptiontype.ForbiddenAccessException;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.social.domain.LikeTargetType;
import com.sandwich.SandWich.social.repository.LikeRepository;
import com.sandwich.SandWich.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import com.sandwich.SandWich.notification.events.CollectionSavedEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CollectionServiceImpl implements CollectionService {

    private final CollectionFolderRepository folderRepository;
    private final CollectionItemRepository itemRepository;
    private final ProjectRepository projectRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final ApplicationEventPublisher events;

    @Value("${app.system.user-id}")
    private Long systemUserId;

    @Override
    @Transactional
    public Long createFolder(User user, CollectionFolderRequest request) {
        CollectionFolder folder = new CollectionFolder();
        folder.setTitle(request.getTitle());
        folder.setDescription(request.getDescription());
        folder.setPrivate(request.isPrivate());
        folder.setUser(user);
        return folderRepository.save(folder).getId();
    }

    @Override
    public List<CollectionFolderResponse> getMyFolders(User user) {
        return folderRepository.findByUser(user).stream()
                .map(folder -> new CollectionFolderResponse(
                        folder.getId(),
                        folder.getTitle(),
                        folder.getDescription(),
                        folder.isPrivate(),
                        folder.getItems().size()
                )).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addProjectToFolders(User user, AddToCollectionRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(ProjectNotFoundException::new);

        boolean anyNewInserted = false;
        String firstFolderName = null;
        Long firstFolderId = null;

        for (Long folderId : request.getFolderIds()) {
            CollectionFolder folder = folderRepository.findById(folderId)
                    .orElseThrow(CollectionFolderNotFoundException::new);

            // 자기 폴더만 추가 가능
            if (!folder.getUser().equals(user)) {
                throw new ForbiddenAccessException();
            }

            // 중복 방지
            boolean exists = itemRepository.existsByFolderIdAndProjectId(folderId, project.getId());
            if (!exists) {
                CollectionItem item = new CollectionItem();
                item.setFolder(folder);
                item.setProject(project);
                itemRepository.save(item);

                anyNewInserted = true;
                if (firstFolderName == null) {
                    firstFolderName = folder.getTitle();
                    firstFolderId = folder.getId();
                }
            }
        }

        // 실제로 새로 추가된 경우에만 알림 발행
        if (anyNewInserted) {
            Long authorId = (project.getUser() != null) ? project.getUser().getId() : null;
            // (참고) findAuthorIdById(...) 메서드가 있으면 그걸 사용해도 됨

            if (authorId != null
                    && !authorId.equals(user.getId())      // 자기 자신 스킵
                    && !authorId.equals(systemUserId)) {   // 시스템 계정 스킵
                events.publishEvent(new CollectionSavedEvent(
                        user.getId(),
                        project.getId(),
                        authorId,
                        firstFolderId,       // optional
                        firstFolderName      // optional
                ));
            }
        }
    }

    @Override
    @Transactional
    public void removeProjectFromFolder(User user, RemoveFromCollectionRequest request) {
        CollectionFolder folder = folderRepository.findById(request.getFolderId())
                .orElseThrow(CollectionFolderNotFoundException::new);

        if (!folder.getUser().equals(user)) {
            throw new ForbiddenAccessException();
        }

        itemRepository.deleteByFolderIdAndProjectId(request.getFolderId(), request.getProjectId());
    }

    @Override
    public CollectionFolderDetailResponse getFolderDetail(User user, Long folderId) {
        CollectionFolder folder = folderRepository.findById(folderId)
                .orElseThrow(CollectionFolderNotFoundException::new);

        // 비공개 제한 처리
        if (folder.isPrivate() && !folder.getUser().equals(user)) {
            throw new ForbiddenAccessException();
        }

        List<ProjectSummary> projects = folder.getItems().stream()
                .map(item -> {
                    Project p = item.getProject();
                    int likeCount = (int) likeRepository.countByTargetTypeAndTargetId(LikeTargetType.PROJECT, p.getId());
                    int commentCount = (int) commentRepository.countByCommentableTypeAndCommentableId("Project", p.getId());

                    return new ProjectSummary(
                            p.getId(),
                            p.getTitle(),
                            p.getCoverUrl(),
                            likeCount,
                            p.getViewCount().intValue(),
                            commentCount
                    );
                }).collect(Collectors.toList());

        return new CollectionFolderDetailResponse(
                folder.getTitle(),
                folder.getDescription(),
                folder.isPrivate(),
                projects
        );
    }


    @Override
    @Transactional
    public void updateFolder(User user, Long folderId, CollectionFolderRequest request) {
        CollectionFolder folder = folderRepository.findById(folderId)
                .orElseThrow(CollectionFolderNotFoundException::new);

        if (!folder.getUser().equals(user)) {
            throw new ForbiddenAccessException();
        }

        folder.setTitle(request.getTitle());
        folder.setDescription(request.getDescription());
        folder.setPrivate(request.isPrivate());
    }

    @Override
    @Transactional
    public void deleteFolder(User user, Long folderId) {
        CollectionFolder folder = folderRepository.findById(folderId)
                .orElseThrow(CollectionFolderNotFoundException::new);

        if (!folder.getUser().equals(user)) {
            throw new ForbiddenAccessException();
        }

        folderRepository.delete(folder); // items는 cascade = REMOVE
    }
}
