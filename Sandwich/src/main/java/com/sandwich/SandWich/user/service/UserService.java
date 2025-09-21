package com.sandwich.SandWich.user.service;


import com.sandwich.SandWich.auth.dto.SignupRequest;
import com.sandwich.SandWich.comment.domain.Comment;
import com.sandwich.SandWich.post.domain.Post;
import com.sandwich.SandWich.comment.repository.CommentRepository;
import com.sandwich.SandWich.post.repository.PostRepository;
import com.sandwich.SandWich.common.exception.exceptiontype.InterestNotFoundException;
import com.sandwich.SandWich.common.exception.exceptiontype.PositionNotFoundException;
import com.sandwich.SandWich.common.exception.exceptiontype.UserNotFoundException;
import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.project.repository.ProjectRepository;
import com.sandwich.SandWich.user.domain.*;
import com.sandwich.SandWich.user.dto.*;
import com.sandwich.SandWich.user.repository.*;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class UserService {

    private final CommentRepository commentRepository;
    private final ProfileRepository profileRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PositionRepository positionRepository;
    private final InterestRepository interestRepository;
    private final UserPositionRepository userPositionRepository;
    private final UserInterestRepository userInterestRepository;
    private final ProjectRepository projectRepository;
    private static final Logger log = LoggerFactory.getLogger(UserService.class);


    @Transactional
    public void upsertUserProfile(User user, UserProfileRequest req) {
        // 포지션
        Position position = positionRepository.findById(req.getPositionId())
                .orElseThrow(PositionNotFoundException::new);
        Optional<UserPosition> existing = userPositionRepository.findByUser(user);
        if (existing.isPresent()) {
            UserPosition userPosition = existing.get();
            userPosition.setPosition(position);
            userPositionRepository.save(userPosition);
        } else {
            userPositionRepository.save(new UserPosition(user, position));
        }

        // 관심사
        if (req.getInterestIds().size() > 3) {
            throw new IllegalArgumentException("관심사는 최대 3개까지 가능합니다.");
        }
        userInterestRepository.deleteByUser(user); // 기존 삭제 후
        for (Long id : req.getInterestIds()) {
            Interest interest = interestRepository.findById(id)
                    .orElseThrow(InterestNotFoundException::new);
            userInterestRepository.save(new UserInterest(user, interest));
        }

        //  프로필 설정 or 수정 (닉네임 등 포함)
        Profile profile = user.getProfile();
        if (profile == null) {
            profile = new Profile();
            profile.setUser(user);
            user.setProfile(profile);
        }

        //  닉네임 중복 검사 (기존 닉네임과 다를 때만)
        if (profileRepository.existsByNickname(req.getNickname()) &&
                (profile.getNickname() == null || !profile.getNickname().equals(req.getNickname()))) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        // 닉네임, skills, bio, github 등 전부 여기에 포함
        profile.updateFrom(req);

        // 저장
        userRepository.save(user);
    }

    @Transactional
    public UserProfileResponse getMe(User user) {
        Profile profile = user.getProfile();

        Position position = user.getUserPosition() != null
                ? user.getUserPosition().getPosition()
                : null;

        List<InterestDto> interests = user.getInterests().stream()
                .map(ui -> new InterestDto(ui.getInterest()))
                .collect(Collectors.toList());

        int followerCount = user.getFollowers().stream()
                .filter(f -> !f.getFollower().isDeleted())
                .toList().size();

        int followingCount = user.getFollowings().stream()
                .filter(f -> !f.getFollowing().isDeleted())
                .toList().size();

        return new UserProfileResponse(
                user.getUsername(),
                user.getEmail(),
                profile != null ? profile.getNickname()   : null,
                profile != null ? profile.getBio() : null,
                profile != null ? profile.getSkills() : null,
                profile != null ? profile.getGithub() : null,
                profile != null ? profile.getLinkedin() : null,
                profile != null ? profile.getProfileImage() : null,
                position != null ? new PositionDto(position) : null,
                interests,
                followerCount,
                followingCount
        );
    }
    public User findByEmail(String email) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(UserNotFoundException::new);

        if (user.isDeleted()) {
            throw new UserNotFoundException();
        }

        return user;
    }

    public void saveBasicProfile(User user, SignupRequest req) {
        // nickname 중복 검사
        if (profileRepository.existsByNickname(req.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        // 프로필 생성
        Profile profile = new Profile();
        profile.setUser(user);
        profile.setNickname(req.getNickname()); // nickname 설정
        user.setProfile(profile);
        profileRepository.save(profile); // 명시적 저장

        //포지션 설정
        Position position = positionRepository.findById(req.getPositionId())
                .orElseThrow(PositionNotFoundException::new);
        userPositionRepository.save(new UserPosition(user, position));

        //관심사 설정
        if (req.getInterestIds().size() > 3) {
            throw new IllegalArgumentException("관심사는 최대 3개까지 가능합니다.");
        }

        for (Long interestId : req.getInterestIds()) {
            Interest interest = interestRepository.findById(interestId)
                    .orElseThrow(InterestNotFoundException::new);
            userInterestRepository.save(new UserInterest(user, interest));
        }
        user.setIsProfileSet(true);
        userRepository.save(user);
    }

    @Transactional
    public void deleteMe(User user) {
        log.info("회원 탈퇴 요청 실행됨 - 이메일: {}", user.getEmail());

        // 1. 유저 정보 soft delete
        user.setIsDeleted(true);
        user.setUsername("탈퇴한 사용자");

        // 2. 프로필 민감 정보 제거
        Profile profile = user.getProfile();
        if (profile != null) {
            profile.setBio(null);
            profile.setSkills(null);
            profile.setGithub(null);
            profile.setLinkedin(null);
            profile.setProfileImage(null);
        }

        // 3. 익명 사용자 계정 없으면 자동 생성
        User anonymous = userRepository.findByEmail("deleted@sandwich.com")
                .orElseGet(() -> {
                    User anon = new User();
                    anon.setEmail("deleted@sandwich.com");
                    anon.setUsername("탈퇴한 사용자");
                    anon.setPassword(null);
                    anon.setProvider("local");
                    anon.setIsDeleted(true);         // 익명 계정도 삭제 상태로 표시
                    anon.setIsVerified(true);
                    anon.setIsProfileSet(false);
                    anon.setRole(Role.ROLE_USER);
                    return userRepository.save(anon);
                });

        // 4. 이 유저가 만든 프로젝트들을 모두 익명 사용자로 교체
        List<Project> myProjects = projectRepository.findByUser(user);
        for (Project project : myProjects) {
            project.setUser(anonymous);
        }

// 4-1. 이 유저가 작성한 게시글(Post)도 익명 사용자로 교체
        List<Post> myPosts = postRepository.findAllByUser(user);
        for (Post post : myPosts) {
            post.setUser(anonymous);
        }

// 4-2. 이 유저가 작성한 댓글(Comment)도 익명 사용자로 교체
        List<Comment> myComments = commentRepository.findAllByUser(user);
        for (Comment comment : myComments) {
            comment.setUser(anonymous);
        }

        // 5. 마지막 저장
        userRepository.save(user);
    }

    public void updateNickname(Long userId, String nickname) {
        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);
        Profile profile = user.getProfile();
        if (profile == null) {
            throw new IllegalStateException("프로필이 존재하지 않습니다.");
        }
        profile.setNickname(nickname);
    }

    @Transactional(readOnly = true)
    public PositionResponse getUserPosition(User user) {
        UserPosition userPosition = userPositionRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("작업 분야가 설정되지 않았습니다."));

        Position p = userPosition.getPosition();
        return new PositionResponse(p.getId(), p.getName());
    }

    @Transactional
    public void updateUserPosition(User user, Long positionId) {
        Position position = positionRepository.findById(positionId)
                .orElseThrow(PositionNotFoundException::new);

        Optional<UserPosition> existing = userPositionRepository.findByUser(user);
        if (existing.isPresent()) {
            UserPosition userPosition = existing.get();
            userPosition.setPosition(position); // 변경
            userPositionRepository.save(userPosition);
        } else {
            userPositionRepository.save(new UserPosition(user, position));
        }
    }

    @Transactional
    public void updateGeneralInterests(User user, List<Long> interestIds) {
        // 관심사는 최대 3개
        if (interestIds.size() > 3) {
            throw new IllegalArgumentException("관심사는 최대 3개까지 선택 가능합니다.");
        }

        // 기존 GENERAL 관심사만 삭제
        List<UserInterest> current = userInterestRepository.findByUser(user);
        current.stream()
                .filter(ui -> ui.getInterest().getType() == InterestType.GENERAL)
                .forEach(userInterestRepository::delete);

        // 새 관심사 추가
        for (Long id : interestIds) {
            Interest interest = interestRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("해당 관심사가 존재하지 않습니다: " + id));

            if (interest.getType() == InterestType.GENERAL) {
                userInterestRepository.save(new UserInterest(user, interest));
            }
        }
    }

    @Transactional(readOnly = true)
    public List<InterestResponse> getGeneralInterests(User user) {
        return userInterestRepository.findByUser(user).stream()
                .map(UserInterest::getInterest)
                .filter(i -> i.getType() == InterestType.GENERAL)
                .map(i -> new InterestResponse(i.getId(), i.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InterestResponse> getTechInterests(User user) {
        return userInterestRepository.findByUser(user).stream()
                .map(UserInterest::getInterest)
                .filter(i -> i.getType() == InterestType.TECH)
                .map(i -> new InterestResponse(i.getId(), i.getName()))
                .toList();
    }

    @Transactional
    public void updateTechInterests(User user, List<Long> interestIds) {
        if (interestIds.size() > 10) {
            throw new IllegalArgumentException("기술 스택은 최대 10개까지 선택 가능합니다.");
        }

        List<UserInterest> current = userInterestRepository.findByUser(user);
        current.stream()
                .filter(ui -> ui.getInterest().getType() == InterestType.TECH)
                .forEach(userInterestRepository::delete);

        for (Long id : interestIds) {
            Interest interest = interestRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("해당 관심사가 존재하지 않습니다: " + id));

            if (interest.getType() == InterestType.TECH) {
                userInterestRepository.save(new UserInterest(user, interest));
            }
        }
    }

    public PublicProfileResponse getPublicProfile(Long userId) {
        var user = userRepository.findByIdWithDetails(userId)
                .orElseThrow(UserNotFoundException::new);

        String posName = (user.getUserPosition() != null && user.getUserPosition().getPosition() != null)
                ? user.getUserPosition().getPosition().getName()
                : null;

        var interestNames = user.getInterests().stream()
                .map(ui -> ui.getInterest() != null ? ui.getInterest().getName() : null)
                .filter(Objects::nonNull)
                .toList();

        return new PublicProfileResponse(
                user.getId(),
                user.getProfile() != null ? user.getProfile().getNickname() : null,
                user.getUsername(),
                user.getEmail(),
                posName,
                interestNames
        );
    }
}