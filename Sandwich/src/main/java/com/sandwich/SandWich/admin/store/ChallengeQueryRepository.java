package com.sandwich.SandWich.admin.store;
import com.sandwich.SandWich.challenge.domain.Challenge;
import com.sandwich.SandWich.challenge.domain.ChallengeStatus;
import com.sandwich.SandWich.challenge.domain.ChallengeType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;


import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;


@Repository
public class ChallengeQueryRepository {


    @PersistenceContext
    private EntityManager em;


    public Page<Challenge> search(String q,
                                  ChallengeType type,
                                  ChallengeStatus status,
                                  OffsetDateTime from,
                                  OffsetDateTime to,
                                  Pageable pageable) {
        CriteriaBuilder cb = em.getCriteriaBuilder();


// data query
        CriteriaQuery<Challenge> cq = cb.createQuery(Challenge.class);
        Root<Challenge> root = cq.from(Challenge.class);
        cq.select(root).where(predicates(cb, root, q, type, status, from, to));
        applySort(cb, cq, root, pageable.getSort());
        TypedQuery<Challenge> tq = em.createQuery(cq);
        tq.setFirstResult((int) pageable.getOffset());
        tq.setMaxResults(pageable.getPageSize());
        List<Challenge> content = tq.getResultList();


// count query
        CriteriaQuery<Long> ccq = cb.createQuery(Long.class);
        Root<Challenge> croot = ccq.from(Challenge.class);
        ccq.select(cb.count(croot)).where(predicates(cb, croot, q, type, status, from, to));
        Long total = em.createQuery(ccq).getSingleResult();


        return new PageImpl<>(content, pageable, total);
    }


    private Predicate[] predicates(CriteriaBuilder cb, Root<Challenge> root,
                                   String q, ChallengeType type, ChallengeStatus status,
                                   OffsetDateTime from, OffsetDateTime to) {
        List<Predicate> ps = new ArrayList<>();
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim().toLowerCase() + "%";
            ps.add(cb.like(cb.lower(root.get("title")), like));
        }
        if (type != null) ps.add(cb.equal(root.get("type"), type));
        if (status != null) ps.add(cb.equal(root.get("status"), status));
        if (from != null) ps.add(cb.greaterThanOrEqualTo(root.get("startAt"), from));
        if (to != null) ps.add(cb.lessThanOrEqualTo(root.get("startAt"), to));
        return ps.toArray(new Predicate[0]);
    }


    private void applySort(CriteriaBuilder cb, CriteriaQuery<?> cq, Root<Challenge> root, Sort sort) {
        if (sort == null || sort.isUnsorted()) {
            cq.orderBy(cb.desc(root.get("startAt")));
            return;
        }
        List<jakarta.persistence.criteria.Order> orders = new ArrayList<>();
        for (Sort.Order o : sort) {
            var path = root.get(o.getProperty());
            orders.add(o.isAscending() ? cb.asc(path) : cb.desc(path));
        }
        cq.orderBy(orders);
    }
}