package com.sandwich.SandWich.customDomain.repository;

import com.sandwich.SandWich.customDomain.domain.customDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface customDomainRepository extends JpaRepository<customDomain, Long> {
    Optional<customDomain> findByCustomPath(String customPath);
}
