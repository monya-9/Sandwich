package com.sandwich.SandWich.social.repository;

import com.sandwich.SandWich.social.domain.Follow;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    // 중복 팔로우 방지용 (팔로우 여부 확인)
    boolean existsByFollowerAndFollowing(User follower, User following);

    // 팔로우 삭제용
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);

    // 내가 팔로우한 사람 목록
    List<Follow> findByFollower(User follower);

    // 나를 팔로우한 사람 목록
    List<Follow> findByFollowing(User following);

    // 팔로워 수
    @Query("SELECT COUNT(f) FROM Follow f WHERE f.following = :user")
    long countByFollowing(User user);

    // 팔로잉 수
    @Query("SELECT COUNT(f) FROM Follow f WHERE f.follower = :user")
    long countByFollower(User user);

    @Query("SELECT f.follower FROM Follow f " +
            "WHERE f.following.id = :userId AND f.follower.isDeleted = false")
    List<User> findFollowersByUserId(@Param("userId") Long userId);

}
