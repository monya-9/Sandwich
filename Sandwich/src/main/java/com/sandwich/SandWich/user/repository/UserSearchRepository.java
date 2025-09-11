package com.sandwich.SandWich.user.repository;


import com.sandwich.SandWich.user.dto.AccountSearchItem;
import com.sandwich.SandWich.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface UserSearchRepository extends JpaRepository<User, Long> {
    @Query(value = """
    select new com.sandwich.SandWich.user.dto.AccountSearchItem(
        u.id, p.nickname, p.profileImage, u.isVerified
    )
    from User u
    join u.profile p
    left join u.userPosition up
    left join up.position pos
    left join u.interests ui
    left join ui.interest intr
    where u.isDeleted = false
      and (
             lower(p.nickname) like lower(concat('%', :q, '%'))
          or lower(coalesce(p.bio, ''))    like lower(concat('%', :q, '%'))
          or lower(coalesce(p.skills, '')) like lower(concat('%', :q, '%'))
          or lower(coalesce(pos.name, '')) like lower(concat('%', :q, '%'))
          or lower(coalesce(intr.name,'')) like lower(concat('%', :q, '%'))
      )
    group by u.id, p.nickname, p.profileImage, u.isVerified
    order by
      case when lower(p.nickname) = lower(:q) then 0 else 1 end,
      case when lower(p.nickname) like lower(concat(:q, '%')) then 0 else 1 end,
      case when u.isVerified = true then 0 else 1 end,
      u.id desc
    """,
            countQuery = """
    select count(distinct u.id)
    from User u
    join u.profile p
    left join u.userPosition up
    left join up.position pos
    left join u.interests ui
    left join ui.interest intr
    where u.isDeleted = false
      and (
             lower(p.nickname) like lower(concat('%', :q, '%'))
          or lower(coalesce(p.bio, ''))    like lower(concat('%', :q, '%'))
          or lower(coalesce(p.skills, '')) like lower(concat('%', :q, '%'))
          or lower(coalesce(pos.name, '')) like lower(concat('%', :q, '%'))
          or lower(coalesce(intr.name,'')) like lower(concat('%', :q, '%'))
      )
    """)
    Page<AccountSearchItem> searchAccounts(@Param("q") String q, Pageable pageable);


}