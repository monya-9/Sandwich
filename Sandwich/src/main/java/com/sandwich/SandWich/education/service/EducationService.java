package com.sandwich.SandWich.education.service;

import com.sandwich.SandWich.education.domain.Education;
import com.sandwich.SandWich.education.domain.EducationLevel;
import com.sandwich.SandWich.education.domain.EducationMajor;
import com.sandwich.SandWich.education.domain.EducationStatus;
import com.sandwich.SandWich.education.dto.EducationPatchRequest;
import com.sandwich.SandWich.education.dto.EducationRequest;
import com.sandwich.SandWich.education.dto.EducationResponse;
import com.sandwich.SandWich.education.dto.MajorResponse;
import com.sandwich.SandWich.education.repository.EducationMajorRepository;
import com.sandwich.SandWich.education.repository.EducationRepository;
import com.sandwich.SandWich.user.domain.User;
import com.sandwich.SandWich.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EducationService {

    private final EducationRepository educationRepository;
    private final UserRepository userRepository;
    private final EducationMajorRepository educationMajorRepository;

    @Transactional
    public MajorResponse addMajor(Long educationId, Long userId, String name) {
        Education edu = getByIdAndUser(educationId, userId); // 소유권 체크 재사용
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("전공명을 입력하세요.");
        }
        var major = educationMajorRepository.save(new EducationMajor(edu, name.trim()));
        return new MajorResponse(major.getId(), major.getName());
    }

    // 전공 목록
    @Transactional(readOnly = true)
    public List<MajorResponse> listMajors(Long educationId, Long userId) {
        Education edu = getByIdAndUser(educationId, userId); // 접근권한 보장
        return educationMajorRepository.findByEducation_Id(edu.getId())
                .stream().map(m -> new MajorResponse(m.getId(), m.getName()))
                .toList();
    }

    // 전공 삭제
    @Transactional
    public void deleteMajor(Long majorId, Long userId) {
        var major = educationMajorRepository.findById(majorId)
                .orElseThrow(() -> new IllegalArgumentException("해당 전공 없음"));
        // 소유권 검증
        if (!major.getEducation().getUser().getId().equals(userId)) {
            throw new SecurityException("권한 없음");
        }
        educationMajorRepository.delete(major);
    }

    public void create(EducationRequest request, Long userId) {
        User user = getUser(userId);

        var level  = parseLevel(request.level());    // null 허용
        var status = parseStatus(request.status());  // null 허용

        Education edu = new Education(
                request.schoolName(),
                request.degree(),
                request.startYear(),
                request.startMonth(),
                request.endYear(),
                request.endMonth(),
                request.description(),
                request.isRepresentative(),
                user,
                level,
                status
        );

        educationRepository.save(edu);
    }

    public void update(Long id, EducationRequest request, Long userId) {
        Education e = getByIdAndUser(id, userId);

        var level  = parseLevel(request.level());
        var status = parseStatus(request.status());

        e.update(
                request.schoolName(),
                request.degree(),
                request.startYear(),
                request.startMonth(),
                request.endYear(),
                request.endMonth(),
                request.description(),
                request.isRepresentative(),
                level,
                status
        );
    }

    public EducationResponse patch(Long id, Long userId, EducationPatchRequest req) {
        Education e = getByIdAndUser(id, userId);

        // null이면 기존 값 유지, null이 아니면 신규 값 적용 → 항상 한 번만 update 호출
        String  schoolName   = (req.schoolName()   != null) ? req.schoolName()   : e.getSchoolName();
        String  degree       = (req.degree()       != null) ? req.degree()       : e.getDegree();
        Integer startYear    = (req.startYear()    != null) ? req.startYear()    : e.getStartYear();
        Integer startMonth   = (req.startMonth()   != null) ? req.startMonth()   : e.getStartMonth();
        Integer endYear      = (req.endYear()      != null) ? req.endYear()      : e.getEndYear();
        Integer endMonth     = (req.endMonth()     != null) ? req.endMonth()     : e.getEndMonth();
        String  description  = (req.description()  != null) ? req.description()  : e.getDescription();
        boolean isRep        = (req.isRepresentative() != null) ? req.isRepresentative() : e.isRepresentative();
        EducationLevel level = (req.level()   != null) ? parseLevel(req.level())   : e.getLevel();
        EducationStatus stat = (req.status()  != null) ? parseStatus(req.status()) : e.getStatus();

        e.update(
                schoolName,
                degree,
                startYear,
                startMonth,
                endYear,
                endMonth,
                description,
                isRep,
                level,
                stat
        );

        // 간단 무결성: 시작 > 종료 금지
        if (e.getStartYear() != null && e.getEndYear() != null) {
            if (e.getStartYear() > e.getEndYear()) {
                throw new IllegalArgumentException("종료 연도는 시작 연도 이후여야 합니다.");
            }
        }
        return EducationResponse.from(e);
    }

    public void delete(Long id, Long userId) {
        Education e = getByIdAndUser(id, userId);
        educationRepository.delete(e);
    }

    @Transactional(readOnly = true)
    public List<EducationResponse> getMyEducations(Long userId) {
        return educationRepository.findByUser(getUser(userId))
                .stream().map(EducationResponse::from).toList();
    }

    public boolean toggleRepresentative(Long id, Long userId) {
        Education e = getByIdAndUser(id, userId);
        e.toggleRepresentative();
        return e.isRepresentative();
    }

    // 대표 학력만 쓰는 곳 있으면 유지, 아니면 나중에 정리 가능
    @Transactional(readOnly = true)
    public List<Education> getRepresentativeEducations(User user) {
        return educationRepository.findByUserAndIsRepresentativeTrue(user);
    }

    private Education getByIdAndUser(Long id, Long userId) {
        Education e = educationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 학력 없음"));
        if (!e.getUser().getId().equals(userId)) {
            throw new SecurityException("권한 없음");
        }
        return e;
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
    }

    private EducationLevel parseLevel(String s) {
        if (s == null || s.isBlank()) return null;
        try { return EducationLevel.valueOf(s); }
        catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("level 값이 올바르지 않습니다. (HIGH_SCHOOL, UNIVERSITY, GRADUATE, BOOTCAMP, OTHER)");
        }
    }

    private EducationStatus parseStatus(String s) {
        if (s == null || s.isBlank()) return null;
        try { return EducationStatus.valueOf(s); }
        catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("status 값이 올바르지 않습니다. (ENROLLED, GRADUATED, LEAVE, DROPPED)");
        }
    }
}
