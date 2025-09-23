package com.sandwich.SandWich.user.repository;

public interface UserAccountRow {
    Long getId();
    String getNickname();     // COALESCE(p.nickname, u.username)
    String getEmail();        // u.email
    String getAvatarUrl();    // p.profileImage
    Boolean getIsVerified();  // u.isVerified
    String getPosition();     // pos.name (nullable)
}