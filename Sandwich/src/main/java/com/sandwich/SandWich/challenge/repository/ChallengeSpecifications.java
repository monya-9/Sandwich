package com.sandwich.SandWich.challenge.repository;
import com.sandwich.SandWich.challenge.domain.*;
import org.springframework.data.jpa.domain.Specification;

public class ChallengeSpecifications {

    private ChallengeSpecifications() {}

    public static Specification<Challenge> hasType(ChallengeType type) {
        if (type == null) return null;
        return (root, q, cb) -> cb.equal(root.get("type"), type);
    }

    public static Specification<Challenge> hasStatus(ChallengeStatus status) {
        if (status == null) return null;
        return (root, q, cb) -> cb.equal(root.get("status"), status);
    }
}