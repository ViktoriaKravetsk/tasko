package com.tasko.backend.project;

import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final String JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    @Transactional
    public ProjectResponse create(Long ownerId, ProjectCreateRequest req) {
        requireAuthenticated(ownerId);

        if (req == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is required");
        }

        String name = trimRequired(req.name(), "name is required");
        String description = trimToNull(req.description());

        String code = generateUniqueJoinCode(8);

        Project saved = projectRepository.save(Project.builder()
                .ownerId(ownerId)
                .name(name)
                .description(description)
                .deadline(req.deadline())
                .joinCode(code)
                .joinEnabled(true)
                .active(true)
                .build());
        memberRepository.save(ProjectMember.builder()
                .projectId(saved.getId())
                .userId(ownerId)
                .role(ProjectRole.OWNER)
                .build());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listMy(Long ownerId) {
        requireAuthenticated(ownerId);

        return projectRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProjectResponse joinByCode(Long userId, String joinCode) {
        requireAuthenticated(userId);

        String code = trimRequired(joinCode, "joinCode is required").toUpperCase();

        Project project = projectRepository.findByJoinCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        if (!project.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Project is inactive");
        }
        if (!project.isJoinEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Join disabled");
        }
        if (memberRepository.existsByProjectIdAndUserId(project.getId(), userId)) {
            return toResponse(project);
        }

        try {
            memberRepository.save(ProjectMember.builder()
                    .projectId(project.getId())
                    .userId(userId)
                    .role(ProjectRole.STUDENT)
                    .build());
        } catch (DataIntegrityViolationException e) {
        }

        return toResponse(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listEnrolled(Long userId) {
        requireAuthenticated(userId);

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

    private void requireAuthenticated(Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
    }

    private String trimRequired(String value, String msg) {
        String v = Objects.requireNonNullElse(value, "").trim();
        if (v.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
        }
        return v;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isBlank() ? null : v;
    }

    private String generateUniqueJoinCode(int len) {
        for (int attempt = 0; attempt < 50; attempt++) {
            String candidate = RandomStringUtils.random(len, JOIN_CODE_ALPHABET);
            if (!projectRepository.existsByJoinCode(candidate)) {
                return candidate;
            }
        }
        throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Cannot generate unique join code"
        );
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
}
