package com.tasko.backend.project;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RNG = new SecureRandom();

    @Transactional
    public ProjectResponse create(Long ownerId, ProjectCreateRequest req) {
        if (ownerId == null) throw new IllegalArgumentException("ownerId is required");
        if (req == null) throw new IllegalArgumentException("request is required");
        if (req.name() == null || req.name().trim().isBlank()) {
            throw new IllegalArgumentException("name is required");
        }

        String code = generateUniqueCode(8);

        Project saved = projectRepository.save(Project.builder()
                .ownerId(ownerId)
                .name(req.name().trim())
                .description(req.description() == null ? null : req.description().trim())
                .deadline(req.deadline())
                .joinCode(code)
                .joinEnabled(true)
                .active(true)
                // важливо: навіть якщо @PrePersist у Entity випадково зламаний — БД не отримає null
                .createdAt(Instant.now())
                .build());

        // owner стає учасником проєкту
        // (якщо вже є - завдяки uq_project_member буде помилка, але в create це зазвичай перший запис)
        memberRepository.save(ProjectMember.builder()
                .projectId(saved.getId())
                .userId(ownerId)
                .role(ProjectRole.OWNER)
                .build());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listMy(Long ownerId) {
        if (ownerId == null) throw new IllegalArgumentException("ownerId is required");
        return projectRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProjectResponse joinByCode(Long userId, String joinCode) {
        if (userId == null) throw new IllegalArgumentException("userId is required");
        if (joinCode == null || joinCode.trim().isBlank()) {
            throw new IllegalArgumentException("joinCode is required");
        }

        String normalizedCode = joinCode.trim().toUpperCase();

        Project project = projectRepository.findByJoinCode(normalizedCode)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.isActive() || !project.isJoinEnabled()) {
            throw new RuntimeException("Join disabled");
        }

        boolean exists = memberRepository.existsByProjectIdAndUserId(project.getId(), userId);
        if (!exists) {
            memberRepository.save(ProjectMember.builder()
                    .projectId(project.getId())
                    .userId(userId)
                    .role(ProjectRole.STUDENT)
                    .build());
        }

        return toResponse(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listEnrolled(Long userId) {
        if (userId == null) throw new IllegalArgumentException("userId is required");

        List<Long> projectIds = memberRepository.findAllByUserId(userId).stream()
                .filter(m -> m.getRole() == ProjectRole.STUDENT)
                .map(ProjectMember::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (projectIds.isEmpty()) return List.of();

        return projectRepository.findAllById(projectIds).stream()
                .map(this::toResponse)
                .toList();
    }

    private ProjectResponse toResponse(Project p) {
        return new ProjectResponse(
                p.getId(),
                p.getName(),
                p.getDescription(),
                p.getDeadline(),
                p.getJoinCode(),
                p.isActive(),
                p.getCreatedAt()
        );
    }

    private String generateUniqueCode(int len) {
        for (int attempt = 0; attempt < 50; attempt++) {
            String candidate = randomCode(len);
            if (!projectRepository.existsByJoinCode(candidate)) return candidate;
        }
        throw new IllegalStateException("Cannot generate unique join code");
    }

    private String randomCode(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(ALPHABET.charAt(RNG.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
