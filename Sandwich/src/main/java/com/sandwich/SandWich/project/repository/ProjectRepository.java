package com.sandwich.SandWich.project.repository;

import com.sandwich.SandWich.project.domain.Project;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {
    @Query("SELECT pr FROM Project pr WHERE pr.user.isDeleted = false")
    List<Project> findAllByUserIsNotDeleted();
    List<Project> findByUser(User user);
    List<Project> findByUserAndIsRepresentativeTrue(User user);
    Page<Project> findAllByOrderByCreatedAtDesc(Pageable pageable);


    @Modifying
    @Transactional
    @org.springframework.data.jpa.repository.Query("update Project p set p.isRepresentative=false where p.user.id = :userId")
    void clearRepresentativeByUserId(@Param("userId") Long userId);

    @Query("SELECT p FROM Project p WHERE p.id = :projectId AND p.user.id = :userId AND p.user.isDeleted = false")
    Optional<Project> findByIdAndUserId(Long projectId, Long userId);

    @Query("select p.user.id from Project p where p.id = :id")
    Optional<Long> findAuthorIdById(@Param("id") Long id);

    @Query("""
        select p
          from Project p
         where p.user.id = :authorId
           and p.id <> :excludeId
           and p.user.isDeleted = false
         order by p.createdAt desc
    """)
    List<Project> findAuthorOthersByLatest(
            @Param("authorId") Long authorId,
            @Param("excludeId") Long excludeId,
            Pageable pageable
    );

    interface UserProjectIdRow {
        Long getUserId();
        Long getProjectId();
    }

    @Query(value = """
        select user_id as userId, id as projectId
        from (
          select p.user_id, p.id,
                 row_number() over(partition by p.user_id order by p.created_at desc) rn
          from project p
          where p.user_id in (:userIds)
        ) t
        where rn <= 3
        """, nativeQuery = true)
    List<UserProjectIdRow> findTop3IdsByUserIds(@Param("userIds") List<Long> userIds);

    /** 유저별 최신 3개 프로젝트 {id, coverUrl}까지 */
    interface UserProjectCardRow {
        Long getUserId();
        Long getProjectId();
        String getCoverUrl();
    }

    @Query(value = """
        select user_id as userId, id as projectId, cover_url as coverUrl
        from (
          select p.user_id, p.id, p.cover_url,
                 row_number() over(partition by p.user_id order by p.created_at desc) rn
          from project p
          where p.user_id in (:userIds)
        ) t
        where rn <= 3
        """, nativeQuery = true)
    List<UserProjectCardRow> findTop3CardsByUserIds(@Param("userIds") List<Long> userIds);
}