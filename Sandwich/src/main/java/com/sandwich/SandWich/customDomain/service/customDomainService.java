package com.sandwich.SandWich.customDomain.service;

import com.fasterxml.jackson.databind.deser.impl.BeanPropertyMap;
import com.sandwich.SandWich.customDomain.domain.customDomain;
import com.sandwich.SandWich.customDomain.repository.customDomainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

@Service
public class customDomainService {

    private final customDomainRepository customDomainRepository;

    @Autowired
    public customDomainService(customDomainRepository customDomainRepository) {
        this.customDomainRepository = customDomainRepository;
    }

    @Transactional
    public customDomain createCustomDomain(Long userId, Long projectId, String customPath, String realPath) {

        if (customDomainRepository.findByCustomPath(customPath).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 사용자 지정 도메인 입니다. 도메인: " + customPath);
        }

        String finalRealPath = realPath
                .replace("{userId}", String.valueOf(userId))
                .replace("{projectId}", String.valueOf(projectId));

        customDomain customDomain = new customDomain();
        customDomain.setUserId(userId);
        customDomain.setProjectId(projectId);
        customDomain.setCustomPath(customPath);
        customDomain.setRealPath(finalRealPath);

        return customDomainRepository.save(customDomain);
    }

    @Transactional(readOnly = true)
    public Optional<customDomain> getRealPathByCustomPath(String customPath) {
        return customDomainRepository.findByCustomPath(customPath);
    }

    @Transactional
    public customDomain updateCustomDomain(Long id, String newCustomPath, String RealPath) {
        customDomain customDomain = customDomainRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 ID의 사용자 지정 도메인을 찾을 수 없습니다. ID: " + id));

        if (newCustomPath != null && !newCustomPath.isEmpty()) {
            if (!customDomain.getCustomPath().equals(newCustomPath) &&
                    customDomainRepository.findByCustomPath(newCustomPath).isPresent()) {
                throw new IllegalArgumentException("이미 존재하는 사용자 지정 도메인 입니다. 도메인: " + newCustomPath);
            }
            customDomain.setCustomPath(newCustomPath);
        }

        customDomain.setUpdatedAt(OffsetDateTime.now());

        return customDomainRepository.save(customDomain);
    }

    @Transactional
    public void deleteCustomDomain(Long id) {
        if (!customDomainRepository.existsById(id)) {
            throw new IllegalArgumentException("해당 ID의 사용자 지정 도메인을 찾을 수 없습니다. ID: " + id);
        }
        customDomainRepository.deleteById(id);
    }
}
