package com.sandwich.SandWich.project.repository;


import com.sandwich.SandWich.project.domain.Project;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.Set;

public final class ProjectSpecs {
    private ProjectSpecs(){}

    public static Specification<Project> always() {
        return (r, q, cb) -> cb.conjunction();
    }

    public static Specification<Project> createdAfter(Instant since) {
        return (r, q, cb) -> cb.greaterThanOrEqualTo(r.get("createdAt"), since);
    }

    public static Specification<Project> authorIn(Set<Long> userIds) {
        return (r, q, cb) -> r.get("user").get("id").in(userIds);
    }

    public static Specification<Project> keywordLike(String qstr) {
        if (qstr == null || qstr.isBlank()) return null;
        String like = "%" + qstr.toLowerCase() + "%";
        return (r, q, cb) -> cb.or(
                cb.like(cb.lower(r.get("title")), like),
                cb.like(cb.lower(r.get("description")), like),
                cb.like(cb.lower(r.get("tools")), like)
        );
    }
}