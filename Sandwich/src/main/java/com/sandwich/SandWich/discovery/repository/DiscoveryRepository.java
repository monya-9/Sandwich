// src/main/java/com/sandwich/SandWich/discovery/repository/DiscoveryRepository.java
package com.sandwich.SandWich.discovery.repository;

import com.sandwich.SandWich.project.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DiscoveryRepository extends JpaRepository<Project, Long> {

    @Query(value = """
    with recent_views as (
      select pv.project_id, sum(pv.count)::bigint as view_cnt
      from project_views pv
      where pv.viewed_at >= now() - (:windowDays || ' days')::interval
      group by pv.project_id
    ),
    recent_likes as (
      select l.target_id as project_id, count(*)::bigint as like_cnt
      from likes l
      where l.target_type = 'PROJECT'
        and l.created_at >= now() - (:windowDays || ' days')::interval
      group by l.target_id
    ),
    recent_comments as (
      select c.commentable_id as project_id, count(*)::bigint as comment_cnt
      from comment c
      where c.commentable_type = 'Project'
        and c.created_at >= now() - (:windowDays || ' days')::interval
      group by c.commentable_id
    ),
    project_scores as (
      select p.user_id,
             coalesce(rv.view_cnt, 0)    as views,
             coalesce(rl.like_cnt, 0)    as likes,
             coalesce(rc.comment_cnt, 0) as comments
      from project p
      left join recent_views    rv on rv.project_id = p.id
      left join recent_likes    rl on rl.project_id = p.id
      left join recent_comments rc on rc.project_id = p.id
    ),
    user_scores as (
      select ps.user_id,
             sum(ps.views)    as views,
             sum(ps.likes)    as likes,
             sum(ps.comments) as comments
      from project_scores ps
      group by ps.user_id
    )
    select us.user_id as userId,
           (:wViews * us.views + :wLikes * us.likes + :wComments * us.comments) as trendScore
    from user_scores us
    join users u on u.id = us.user_id and u.is_deleted = false
    order by trendScore desc
    limit :limit offset :offset
    """, nativeQuery = true)
    List<HotDeveloperRow> findHotDevelopers(
            @Param("windowDays") int windowDays,
            @Param("wViews") double wViews,
            @Param("wLikes") double wLikes,
            @Param("wComments") double wComments,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    interface HotDeveloperRow {
        Long getUserId();
        Double getTrendScore();
    }
}
