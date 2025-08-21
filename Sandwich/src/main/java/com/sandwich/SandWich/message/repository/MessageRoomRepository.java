package com.sandwich.SandWich.message.repository;

import com.sandwich.SandWich.message.domain.MessageRoom;
import com.sandwich.SandWich.message.room.repository.RoomListRow;
import com.sandwich.SandWich.message.room.repository.RoomMetaRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MessageRoomRepository extends JpaRepository<MessageRoom, Long> {

    @Query("""
select
  r.id as roomId,
  case when u1.id = :meId then u2.id else u1.id end as partnerId,
  case when u1.id = :meId
       then coalesce(p2.nickname, u2.username)
       else coalesce(p1.nickname, u1.username) end as partnerName,
  case when u1.id = :meId
       then p2.profileImage
       else p1.profileImage end as partnerAvatarUrl,
  ( select m1.id
    from Message m1
    where m1.room = r
      and m1.createdAt = (
        select max(m2.createdAt) from Message m2 where m2.room = r
      )
  ) as lastMessageId,
  cast(r.lastMessageType as string) as lastMessageType,
  r.lastMessagePreview as lastMessagePreview,
  r.lastMessageAt as lastMessageAt,
  ( select count(ms)
    from Message ms
    where ms.room = r
      and ms.receiver.id = :meId
      and ms.isRead = false
  ) as unreadCount
from MessageRoom r
  join r.user1 u1
  join r.user2 u2
  left join u1.profile p1
  left join u2.profile p2
where :meId in (u1.id, u2.id)
order by r.lastMessageAt desc
""")
    Page<RoomListRow> findRoomList(@Param("meId") Long meId, Pageable pageable);

    // 두 사용자 조합으로 방 1개 고정
    @Query("""
        SELECT r FROM MessageRoom r
        WHERE (r.user1.id = :a AND r.user2.id = :b)
           OR (r.user1.id = :b AND r.user2.id = :a)
    """)
    Optional<MessageRoom> findBetween(@Param("a") Long a, @Param("b") Long b);

    // 권한 체크: me가 해당 room의 참가자인가?
    @Query("""
        SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
        FROM MessageRoom r
        WHERE r.id = :roomId
          AND (r.user1.id = :userId OR r.user2.id = :userId)
    """)
    boolean isParticipant(@Param("roomId") Long roomId, @Param("userId") Long userId);

    // (옵션) 파트너 ID만 바로 얻고 싶을 때
    @Query("""
        SELECT CASE WHEN r.user1.id = :meId THEN r.user2.id ELSE r.user1.id END
        FROM MessageRoom r
        WHERE r.id = :roomId
          AND (r.user1.id = :meId OR r.user2.id = :meId)
    """)
    Optional<Long> findPartnerId(@Param("roomId") Long roomId, @Param("meId") Long meId);

    @Query("""
    select
      r.id as roomId,
      case when u1.id = :meId then u2.id else u1.id end as partnerId,
      case when u1.id = :meId
           then coalesce(p2.nickname, u2.username)
           else coalesce(p1.nickname, u1.username) end as partnerName,
      case when u1.id = :meId
           then p2.profileImage
           else p1.profileImage end as partnerAvatarUrl,
      (
        select m1.id
        from Message m1
        where m1.room = r
          and m1.createdAt = (
            select max(m2.createdAt) from Message m2 where m2.room = r
          )
      ) as lastMessageId,
      cast(r.lastMessageType as string) as lastMessageType,
      r.lastMessagePreview as lastMessagePreview,
      r.lastMessageAt as lastMessageAt,
      (
        select count(ms)
        from Message ms
        where ms.room = r
          and ms.receiver.id = :meId
          and ms.isRead = false
      ) as unreadCount
    from MessageRoom r
      join r.user1 u1
      join r.user2 u2
      left join u1.profile p1
      left join u2.profile p2
    where r.id = :roomId
      and (:meId in (u1.id, u2.id))""")
    Optional<RoomMetaRow> findRoomMeta(@Param("meId") Long meId, @Param("roomId") Long roomId);
}

