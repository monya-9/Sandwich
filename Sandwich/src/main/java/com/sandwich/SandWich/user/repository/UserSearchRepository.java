package com.sandwich.SandWich.user.repository;

import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface UserSearchRepository extends JpaRepository<User, Long> {

    @Query(value = """
        select distinct
               u.id as id,
               COALESCE(p.nickname, u.username) as nickname,
               u.email as email,
               p.profileImage as avatarUrl,
               u.isVerified as isVerified,
               pos.name as position
          from User u
          left join u.profile p
          left join u.userPosition up
          left join up.position pos
          left join u.interests ui
          left join ui.interest intr
         where u.isDeleted = false
           and (
                 lower(COALESCE(p.nickname, u.username)) like lower(concat('%', :q, '%'))
              or lower(coalesce(p.bio, ''))    like lower(concat('%', :q, '%'))
              or lower(coalesce(p.skills, '')) like lower(concat('%', :q, '%'))
              or lower(coalesce(pos.name, '')) like lower(concat('%', :q, '%'))
              or lower(coalesce(intr.name,'')) like lower(concat('%', :q, '%'))
           )
        """,
            countQuery = """
        select count(distinct u.id)
          from User u
          left join u.profile p
          left join u.userPosition up
          left join up.position pos
          left join u.interests ui
          left join ui.interest intr
         where u.isDeleted = false
           and (
                 lower(COALESCE(p.nickname, u.username)) like lower(concat('%', :q, '%'))
              or lower(coalesce(p.bio, ''))    like lower(concat('%', :q, '%'))
              or lower(coalesce(p.skills, '')) like lower(concat('%', :q, '%'))
              or lower(coalesce(pos.name, '')) like lower(concat('%', :q, '%'))
              or lower(coalesce(intr.name,'')) like lower(concat('%', :q, '%'))
           )
        """)
    Page<UserAccountRow> searchAccounts(@Param("q") String q, Pageable pageable);
}
