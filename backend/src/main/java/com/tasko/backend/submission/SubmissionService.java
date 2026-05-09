package com.tasko.backend.submission;

import com.tasko.backend.ai.AiEvaluationService;
import com.tasko.backend.exception.BadRequestException;
import com.tasko.backend.exception.ForbiddenException;
import com.tasko.backend.exception.NotFoundException;
import com.tasko.backend.notification.NotificationService;
import com.tasko.backend.project.ProjectMember;
import com.tasko.backend.project.ProjectMemberRepository;
import com.tasko.backend.project.ProjectRole;
import com.tasko.backend.task.Task;
import com.tasko.backend.task.TaskRepository;
import com.tasko.backend.user.User;
import com.tasko.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;

    private final AiEvaluationService aiEvaluationService;
    private final NotificationService notificationService;

    @Transactional
    public SubmissionResponse upsertMy(Long userId, Long projectId, Long taskId, SubmissionUpsertRequest req) {
        requireStudent(projectId, userId);

        if (req == null) {
            throw new BadRequestException("Request is required");
        }

        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        String text = trimToNull(req.textAnswer());
        String link = trimToNull(req.fileLink());

        if (text == null && link == null) {
            throw new BadRequestException("Either textAnswer or fileLink is required");
        }

        boolean late = computeLate(task);
        Instant now = Instant.now();

        Submission submission = submissionRepository.findByTaskIdAndStudentId(taskId, userId)
                .map(existing -> {
                    existing.setTextAnswer(text);
                    existing.setFileLink(link);
                    existing.setSubmittedAt(now);
                    existing.setLate(late);
                    existing.setAiScore(null);
                    existing.setAiComment(null);
                    existing.setAiEvaluatedAt(null);

                    return existing;
                })
                .orElseGet(() -> Submission.builder()
                        .taskId(taskId)
                        .studentId(userId)
                        .textAnswer(text)
                        .fileLink(link)
                        .submittedAt(now)
                        .late(late)
                        .aiScore(null)
                        .aiComment(null)
                        .aiEvaluatedAt(null)
                        .build());

        Submission saved = submissionRepository.save(submission);

        aiEvaluationService.evaluateAsync(saved.getId());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getMy(Long userId, Long projectId, Long taskId) {
        requireStudent(projectId, userId);

        taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        Submission submission = submissionRepository.findByTaskIdAndStudentId(taskId, userId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));

        return toResponse(submission);
    }

    @Transactional
    public SubmissionResponse grade(Long userId, Long projectId, Long taskId, Long submissionId, SubmissionGradeRequest req) {
        requireOwner(projectId, userId);

        if (req == null) throw new BadRequestException("Request is required");

        Task task = taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));

        if (!submission.getTaskId().equals(taskId)) {
            throw new BadRequestException("Submission does not belong to this task");
        }

        Integer maxScore = task.getMaxScore();
        if (maxScore != null && req.teacherScore() > maxScore) {
            throw new BadRequestException("teacherScore must be <= maxScore");
        }

        submission.setTeacherScore(req.teacherScore());
        submission.setTeacherComment(trimToNull(req.teacherComment()));
        submission.setGradedAt(Instant.now());

        Submission saved = submissionRepository.save(submission);

        notificationService.submissionGraded(saved.getId());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getForOwner(Long userId, Long projectId, Long taskId, Long submissionId) {
        requireOwner(projectId, userId);

        taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));

        if (!submission.getTaskId().equals(taskId)) {
            throw new BadRequestException("Submission does not belong to this task");
        }

        return toResponse(submission);
    }

    @Transactional(readOnly = true)
    public List<SubmissionShortResponse> listForOwner(Long userId, Long projectId, Long taskId, String search) {
        requireOwner(projectId, userId);

        taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        String normalizedSearch = normalizeSearch(search);

        List<Submission> submissions = normalizedSearch == null
                ? submissionRepository.findByTaskIdForOwner(taskId)
                : submissionRepository.findByTaskIdForOwnerAndSearch(taskId, normalizedSearch);

        return submissions.stream()
                .map(this::toShort)
                .toList();
    }

    @Transactional
    public SubmissionResponse reEvaluateAi(Long userId, Long projectId, Long taskId, Long submissionId) {
        requireOwner(projectId, userId);

        taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));

        if (!submission.getTaskId().equals(taskId)) {
            throw new BadRequestException("Submission does not belong to this task");
        }

        submission.setAiScore(null);
        submission.setAiComment(null);
        submission.setAiEvaluatedAt(null);

        Submission saved = submissionRepository.save(submission);

        aiEvaluationService.evaluateAsync(saved.getId());

        return toResponse(saved);
    }

    private void requireStudent(Long projectId, Long userId) {
        ProjectMember m = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ForbiddenException("Not a project member"));

        if (m.getRole() != ProjectRole.STUDENT) {
            throw new ForbiddenException("Only STUDENT can do this");
        }
    }

    private void requireOwner(Long projectId, Long userId) {
        ProjectMember m = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ForbiddenException("Not a project member"));

        if (m.getRole() != ProjectRole.OWNER) {
            throw new ForbiddenException("Only OWNER can do this");
        }
    }

    private boolean computeLate(Task task) {
        LocalDate deadline = task.getDeadline();
        return deadline != null && LocalDate.now().isAfter(deadline);
    }

    private String trimToNull(String s) {
        if (s == null) return null;
        String v = s.trim();
        return v.isBlank() ? null : v;
    }

    private String normalizeSearch(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isBlank() ? null : v;
    }

    private SubmissionStatus computeStatus(Submission s) {
        return s.getTeacherScore() == null ? SubmissionStatus.SUBMITTED : SubmissionStatus.GRADED;
    }

    private SubmissionResponse toResponse(Submission s) {
        String studentName = userRepository.findById(s.getStudentId())
                .map(User::getName)
                .orElse("Unknown");

        return new SubmissionResponse(
                s.getId(), s.getTaskId(), s.getStudentId(), studentName,
                s.getTextAnswer(), s.getFileLink(),
                s.getSubmittedAt(), s.isLate(),
                s.getTeacherScore(), s.getTeacherComment(),
                s.getGradedAt(),
                s.getAiScore(), s.getAiComment(), s.getAiEvaluatedAt(),
                computeStatus(s)
        );
    }

    private SubmissionShortResponse toShort(Submission s) {
        String studentName = userRepository.findById(s.getStudentId())
                .map(User::getName)
                .orElse("Unknown");

        return new SubmissionShortResponse(
                s.getId(),
                s.getTaskId(),
                s.getStudentId(),
                studentName,
                s.getSubmittedAt(),
                s.isLate(),
                s.getTeacherScore(),
                s.getGradedAt()
        );
    }
}