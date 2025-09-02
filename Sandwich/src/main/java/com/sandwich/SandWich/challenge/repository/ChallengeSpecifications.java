package com.sandwich.SandWich.challenge.repository;
import com.sandwich.SandWich.challenge.domain.*;
import org.springframework.data.jpa.domain.Specification;

public class ChallengeSpecifications {

    public static Specification<Challenge> hasType(ChallengeType type) {
        return (root, query, cb) -> type == null ? cb.conjunction() : cb.equal(root.get("type"), type);
    }

    public static Specification<Challenge> hasStatus(ChallengeStatus status) {
        return (root, query, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }
}