package com.sandwich.SandWich.admin.store;


import com.sandwich.SandWich.challenge.domain.Submission;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Repository;


import java.util.ArrayList;
import java.util.List;


@Repository
public class SubmissionQueryRepository {


    @PersistenceContext
    private EntityManager em;


    public Page<Submission> findByChallenge(Long challengeId, String q, Long ownerId, Pageable pageable) {
        var cb = em.getCriteriaBuilder();


        CriteriaQuery<Submission> cq = cb.createQuery(Submission.class);
        Root<Submission> root = cq.from(Submission.class);
        cq.select(root).where(predicates(cb, root, challengeId, q, ownerId));
        applySort(cb, cq, root, pageable.getSort());


        TypedQuery<Submission> tq = em.createQuery(cq);
        tq.setFirstResult((int) pageable.getOffset());
        tq.setMaxResults(pageable.getPageSize());
        List<Submission> content = tq.getResultList();


        CriteriaQuery<Long> ccq = cb.createQuery(Long.class);
        Root<Submission> croot = ccq.from(Submission.class);
        ccq.select(cb.count(croot)).where(predicates(cb, croot, challengeId, q, ownerId));
        Long total = em.createQuery(ccq).getSingleResult();


        return new PageImpl<>(content, pageable, total);
    }


    private Predicate[] predicates(CriteriaBuilder cb, Root<Submission> root,
                                   Long challengeId, String q, Long ownerId) {
        List<Predicate> ps = new ArrayList<>();
        ps.add(cb.equal(root.get("challenge").get("id"), challengeId));
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim().toLowerCase() + "%";
            ps.add(cb.like(cb.lower(root.get("title")), like));
        }
        if (ownerId != null) ps.add(cb.equal(root.get("ownerId"), ownerId));
        return ps.toArray(new Predicate[0]);
    }


    private void applySort(CriteriaBuilder cb, CriteriaQuery<?> cq, Root<Submission> root, Sort sort) {
        if (sort == null || sort.isUnsorted()) {
            cq.orderBy(cb.desc(root.get("createdAt")));
            return;
        }
        List<Order> orders = new ArrayList<>();
        for (Sort.Order o : sort) {
            var path = root.get(o.getProperty());
            orders.add(o.isAscending() ? cb.asc(path) : cb.desc(path));
        }
        cq.orderBy(orders);
    }
}