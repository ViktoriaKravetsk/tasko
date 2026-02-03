package com.tasko.backend.task;

import com.tasko.backend.project.ProjectMember;
import com.tasko.backend.project.ProjectMemberRepository;
import com.tasko.backend.project.ProjectRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectMemberRepository memberRepository;

    @Transactional
    public TaskResponse create(Long userId, Long projectId, TaskCreateRequest req) {
        requireOwner(projectId, userId);

        String title = normalizeRequired(req.title(), "Title is required");

        Task saved = taskRepository.save(Task.builder()
                .projectId(projectId)
                .title(title)
                .description(normalizeNullable(req.description()))
                .deadline(req.deadline())
                .maxScore(req.maxScore())
                .status(TaskStatus.TODO)
                .build());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<TaskShortResponse> list(Long userId, Long projectId) {
        requireMember(projectId, userId);

        return taskRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::toShortResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getById(Long userId, Long projectId, Long taskId) {
        requireMember(projectId, userId);

        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        return toResponse(task);
    }

    @Transactional
    public TaskResponse update(Long userId, Long projectId, Long taskId, TaskUpdateRequest req) {
        requireOwner(projectId, userId);

        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (req.title() != null) task.setTitle(normalizeRequired(req.title(), "Title is required"));
        if (req.description() != null) task.setDescription(normalizeNullable(req.description()));
        if (req.deadline() != null) task.setDeadline(req.deadline());
        if (req.maxScore() != null) task.setMaxScore(req.maxScore());

        task.setUpdatedAt(Instant.now());
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(Long userId, Long projectId, Long taskId, TaskStatusUpdateRequest req) {
        requireOwner(projectId, userId);

        if (req.status() == null) throw new RuntimeException("Status is required");

        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setStatus(req.status());
        task.setUpdatedAt(Instant.now());
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public void delete(Long userId, Long projectId, Long taskId) {
        requireOwner(projectId, userId);

        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        taskRepository.delete(task);
    }


    private void requireMember(Long projectId, Long userId) {
        if (!memberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new RuntimeException("Not a project member");
        }
    }

    private void requireOwner(Long projectId, Long userId) {
        ProjectMember membership = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new RuntimeException("Not a project member"));

        if (membership.getRole() != ProjectRole.OWNER) {
            throw new RuntimeException("Only OWNER can do this");
        }
    }

    private String normalizeRequired(String value, String msg) {
        String v = (value == null) ? "" : value.trim();
        if (v.isBlank()) throw new RuntimeException(msg);
        return v;
    }

    private String normalizeNullable(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isBlank() ? null : v;
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
                t.getStatus(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
