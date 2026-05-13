package com.tasko.backend.project;

import com.tasko.backend.exception.BadRequestException;
import com.tasko.backend.exception.ForbiddenException;
import com.tasko.backend.exception.InternalException;
import com.tasko.backend.exception.NotFoundException;
import com.tasko.backend.submission.SubmissionRepository;
import com.tasko.backend.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final String JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int MAX_PROJECT_PAGE_SIZE = 9;
    private static final int PROJECT_DESCRIPTION_MAX_LENGTH = 200;
    private static final int PROJECT_DESCRIPTION_MAX_SEGMENT_LENGTH = 40;

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final TaskRepository taskRepository;
    private final SubmissionRepository submissionRepository;

    @Transactional
    public ProjectResponse create(Long ownerId, ProjectCreateRequest req) {
        if (req == null) {
            throw new BadRequestException("Request is required");
        }

        String name = trimRequired(req.name(), "name is required");
        String emoji = normalizeEmoji(req.emoji());
        String description = trimDescription(req.description());
        LocalDate deadline = validateDeadline(req.deadline());

        String code = generateUniqueJoinCode(8);

        Project saved = projectRepository.save(Project.builder()
                .ownerId(ownerId)
                .name(name)
                .emoji(emoji)
                .description(description)
                .deadline(deadline)
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
    public List<ProjectResponse> listMy(Long ownerId, String search) {
        String normalizedSearch = normalizeSearch(search);

        List<Project> projects = normalizedSearch == null
                ? projectRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                : projectRepository.findByOwnerIdAndNameContainingIgnoreCaseOrderByCreatedAtDesc(ownerId, normalizedSearch);

        return projects.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectPageResponse listMyPage(Long ownerId, String search, int page, int size) {
        String normalizedSearch = normalizeSearch(search);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PROJECT_PAGE_SIZE);

        PageRequest pageable = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Project> projects = normalizedSearch == null
                ? projectRepository.findByOwnerId(ownerId, pageable)
                : projectRepository.findByOwnerIdAndNameContainingIgnoreCase(ownerId, normalizedSearch, pageable);

        List<ProjectResponse> items = projects.stream()
                .map(this::toResponse)
                .toList();

        return new ProjectPageResponse(
                items,
                projects.getNumber(),
                projects.getSize(),
                projects.getTotalElements(),
                projects.getTotalPages(),
                projects.isFirst(),
                projects.isLast()
        );
    }

    @Transactional
    public ProjectResponse joinByCode(Long userId, String joinCode) {
        String code = trimRequired(joinCode, "joinCode is required").toUpperCase();

        Project project = projectRepository.findByJoinCode(code)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        if (!project.isActive()) {
            throw new ForbiddenException("Project is inactive");
        }
        if (!project.isJoinEnabled()) {
            throw new ForbiddenException("Join disabled");
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
            return toResponse(project);
        }

        return toResponse(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> listEnrolled(Long userId, String search) {
        String normalizedSearch = normalizeSearch(search);

        List<Project> projects = normalizedSearch == null
                ? memberRepository.findStudentProjects(userId)
                : memberRepository.findStudentProjectsBySearch(userId, normalizedSearch);

        return projects.stream()
                .map(this::toResponse)
                .toList();
    }

    private String trimRequired(String value, String msg) {
        String v = Objects.requireNonNullElse(value, "").trim();
        if (v.isBlank()) {
            throw new BadRequestException(msg);
        }
        return v;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isBlank() ? null : v;
    }

    private String trimDescription(String value) {
        String description = trimToNull(value);
        if (description != null && description.length() > PROJECT_DESCRIPTION_MAX_LENGTH) {
            throw new BadRequestException("Description must be " + PROJECT_DESCRIPTION_MAX_LENGTH + " characters or less");
        }
        if (description != null && hasTooLongSegment(description)) {
            throw new BadRequestException("Description cannot contain a word or sequence longer than "
                    + PROJECT_DESCRIPTION_MAX_SEGMENT_LENGTH + " characters");
        }
        return description;
    }

    private boolean hasTooLongSegment(String value) {
        for (String segment : value.trim().split("\\s+")) {
            if (segment.length() > PROJECT_DESCRIPTION_MAX_SEGMENT_LENGTH) {
                return true;
            }
        }
        return false;
    }

    private LocalDate validateDeadline(LocalDate value) {
        if (value != null && value.isBefore(LocalDate.now())) {
            throw new BadRequestException("Deadline cannot be earlier than today");
        }
        return value;
    }

    private String normalizeSearch(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isBlank() ? null : v;
    }

    private String normalizeEmoji(String value) {
        if (value == null) return "📁";
        String v = value.trim();
        if (v.isBlank()) return "📁";
        return v.length() > 16 ? v.substring(0, 16) : v;
    }

    private String generateUniqueJoinCode(int len) {
        for (int attempt = 0; attempt < 50; attempt++) {
            String candidate = RandomStringUtils.random(len, JOIN_CODE_ALPHABET);
            if (!projectRepository.existsByJoinCode(candidate)) {
                return candidate;
            }
        }
        throw new InternalException("Cannot generate unique join code");
    }

    private ProjectResponse toResponse(Project p) {
        return new ProjectResponse(
                p.getId(),
                p.getName(),
                p.getEmoji(),
                p.getDescription(),
                p.getDeadline(),
                p.getJoinCode(),
                p.isActive(),
                p.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public ProjectProgressResponse myProgress(Long userId, Long projectId) {
        memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ForbiddenException("Not a project member"));

        int total = taskRepository.sumMaxScoreByProjectId(projectId);
        int earned = submissionRepository.sumEarnedScore(projectId, userId);

        return new ProjectProgressResponse(projectId, earned, total);
    }

    @Transactional
    public ProjectResponse updateProject(Long userId, Long projectId, ProjectUpdateRequest req) {
        if (req == null) {
            throw new BadRequestException("Request is required");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        if (!project.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Only owner can edit project");
        }

        project.setName(trimRequired(req.name(), "name is required"));
        project.setEmoji(normalizeEmoji(req.emoji()));
        project.setDescription(trimDescription(req.description()));
        project.setDeadline(validateDeadline(req.deadline()));

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(Long userId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        if (!project.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Only owner can delete project");
        }

        List<Long> taskIds = taskRepository.findIdsByProjectId(projectId);
        if (!taskIds.isEmpty()) {
            submissionRepository.deleteAllByTaskIdIn(taskIds);
        }
        taskRepository.deleteAllByProjectId(projectId);
        memberRepository.deleteAllByProjectId(projectId);
        projectRepository.delete(project);
    }

    @Transactional
    public void leaveProject(Long userId, Long projectId) {
        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new NotFoundException("Not a member of this project"));

        if (ProjectRole.OWNER.equals(member.getRole())) {
            throw new ForbiddenException("Owner cannot leave the project");
        }

        memberRepository.delete(member);
    }
}
