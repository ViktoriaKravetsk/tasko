package com.tasko.backend.task;

import com.tasko.backend.exception.BadRequestException;
import com.tasko.backend.exception.ForbiddenException;
import com.tasko.backend.exception.NotFoundException;
import com.tasko.backend.exception.UnauthenticatedException;
import com.tasko.backend.notification.NotificationService;
import com.tasko.backend.project.ProjectMember;
import com.tasko.backend.project.ProjectMemberRepository;
import com.tasko.backend.project.ProjectRole;
import com.tasko.backend.submission.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectMemberRepository memberRepository;
    private final SubmissionRepository submissionRepository;
    private final NotificationService notificationService;

    @Transactional
    public TaskResponse create(Long userId, Long projectId, TaskCreateRequest req) {
        requireOwner(projectId, userId);

        if (req == null) throw new BadRequestException("Request is required");

        String title = normalizeRequired(req.title(), "Title is required");

        Task saved = taskRepository.save(Task.builder()
                .projectId(projectId)
                .title(title)
                .description(normalizeNullable(req.description()))
                .deadline(req.deadline())
                .maxScore(req.maxScore())
                .allowResubmissionAfterGrade(resolveAllowResubmissionAfterGrade(req.allowResubmissionAfterGrade()))
                .status(TaskStatus.TODO)
                .build());

        notificationService.taskCreated(saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskShortResponse> list(Long userId, Long projectId, String search, TaskDeadlineFilter deadlineFilter) {
        requireMember(projectId, userId);

        String normalizedSearch = normalizeSearch(search);
        TaskDeadlineFilter safeFilter = deadlineFilter == null ? TaskDeadlineFilter.ALL : deadlineFilter;
        LocalDate today = LocalDate.now();

        List<Task> tasks;

        if (normalizedSearch == null) {
            tasks = switch (safeFilter) {
                case ALL -> taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
                case OVERDUE -> taskRepository.findOverdueByProjectId(projectId, today);
                case UPCOMING -> taskRepository.findUpcomingByProjectId(projectId, today);
                case NO_DEADLINE -> taskRepository.findNoDeadlineByProjectId(projectId);
            };
        } else {
            tasks = switch (safeFilter) {
                case ALL -> taskRepository.findByProjectIdAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(projectId, normalizedSearch);
                case OVERDUE -> taskRepository.findOverdueByProjectIdAndSearch(projectId, normalizedSearch, today);
                case UPCOMING -> taskRepository.findUpcomingByProjectIdAndSearch(projectId, normalizedSearch, today);
                case NO_DEADLINE -> taskRepository.findNoDeadlineByProjectIdAndSearch(projectId, normalizedSearch);
            };
        }

        return tasks.stream()
                .map(this::toShortResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getById(Long userId, Long projectId, Long taskId) {
        requireMember(projectId, userId);

        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        return toResponse(task);
    }

    @Transactional
    public TaskResponse update(Long userId, Long projectId, Long taskId, TaskUpdateRequest req) {
        requireOwner(projectId, userId);

        if (req == null) throw new BadRequestException("Request is required");

        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        if (req.title() != null) task.setTitle(normalizeRequired(req.title(), "Title is required"));
        if (req.description() != null) task.setDescription(normalizeNullable(req.description()));
        if (req.deadline() != null) task.setDeadline(req.deadline());
        if (req.maxScore() != null) task.setMaxScore(req.maxScore());
        if (req.allowResubmissionAfterGrade() != null) {
            task.setAllowResubmissionAfterGrade(req.allowResubmissionAfterGrade());
        }

        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(Long userId, Long projectId, Long taskId, TaskStatusUpdateRequest req) {
        requireOwner(projectId, userId);

        if (req == null || req.status() == null) throw new BadRequestException("Status is required");

        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        task.setStatus(req.status());

        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public void delete(Long userId, Long projectId, Long taskId) {
        requireOwner(projectId, userId);

        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        submissionRepository.deleteAllByTaskId(taskId);
        taskRepository.delete(task);
    }

    private void requireMember(Long projectId, Long userId) {
        if (userId == null) throw new UnauthenticatedException();
        if (projectId == null) throw new BadRequestException("projectId is required");

        if (!memberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ForbiddenException("Not a project member");
        }
    }

    private void requireOwner(Long projectId, Long userId) {
        if (userId == null) throw new UnauthenticatedException();
        if (projectId == null) throw new BadRequestException("projectId is required");

        ProjectMember membership = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ForbiddenException("Not a project member"));

        if (membership.getRole() != ProjectRole.OWNER) {
            throw new ForbiddenException("Only OWNER can do this");
        }
    }

    private String normalizeRequired(String value, String msg) {
        String v = Objects.requireNonNullElse(value, "").trim();
        if (v.isBlank()) throw new BadRequestException(msg);
        return v;
    }

    private String normalizeNullable(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isBlank() ? null : v;
    }

    private String normalizeSearch(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isBlank() ? null : v;
    }

    private boolean resolveAllowResubmissionAfterGrade(Boolean value) {
        return value == null || value;
    }

    private TaskShortResponse toShortResponse(Task t) {
        return new TaskShortResponse(
                t.getId(),
                t.getProjectId(),
                t.getTitle(),
                t.getStatus(),
                t.getDeadline(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }

    private TaskResponse toResponse(Task t) {
        return new TaskResponse(
                t.getId(),
                t.getProjectId(),
                t.getTitle(),
                t.getDescription(),
                t.getDeadline(),
                t.getMaxScore(),
                t.isAllowResubmissionAfterGrade(),
                t.getStatus(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
