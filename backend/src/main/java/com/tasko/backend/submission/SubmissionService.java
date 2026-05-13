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
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

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

        Submission submission = submissionRepository.findByTaskIdAndStudentId(taskId, userId)
                .orElse(null);
        boolean isNewSubmission = submission == null;
        boolean wasGraded = submission != null && submission.getTeacherScore() != null;

        if (submission != null) {
            if (!hasContentChanged(submission, text, link)) {
                return toResponse(submission);
            }

            if (wasGraded && !task.isAllowResubmissionAfterGrade()) {
                throw new ForbiddenException("Resubmission after grading is not allowed for this task");
            }

            submission.setTextAnswer(text);
            submission.setFileLink(link);
            submission.setSubmittedAt(Instant.now());
            submission.setLate(computeLate(task));
            clearTeacherGrade(submission);
            aiEvaluationService.prepareForEvaluation(submission);
        } else {
            submission = Submission.builder()
                    .taskId(taskId)
                    .studentId(userId)
                    .textAnswer(text)
                    .fileLink(link)
                    .submittedAt(Instant.now())
                    .late(computeLate(task))
                    .build();
            aiEvaluationService.prepareForEvaluation(submission);
        }

        Submission saved = submissionRepository.save(submission);

        runAfterCommit(() -> {
            notifySubmissionChanged(saved.getId(), isNewSubmission, wasGraded);
            scheduleAiEvaluation(saved);
        });

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
        if (req.teacherScore() == null) throw new BadRequestException("teacherScore is required");
        if (req.teacherScore() < 0) throw new BadRequestException("teacherScore must be >= 0");

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

        runAfterCommit(() -> notificationService.submissionGraded(saved.getId()));

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

        List<ProjectMember> students = memberRepository.findAllByProjectIdAndRole(projectId, ProjectRole.STUDENT);
        List<Long> studentIds = students.stream()
                .map(ProjectMember::getUserId)
                .toList();

        Map<Long, User> usersById = userRepository.findAllById(studentIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        Map<Long, Submission> submissionsByStudentId = submissionRepository.findAllByTaskIdOrderBySubmittedAtDesc(taskId).stream()
                .collect(Collectors.toMap(
                        Submission::getStudentId,
                        Function.identity(),
                        (left, right) -> left
                ));

        return students.stream()
                .map(student -> toShort(taskId, student.getUserId(), usersById.get(student.getUserId()), submissionsByStudentId.get(student.getUserId())))
                .filter(row -> matchesSearch(row, normalizedSearch))
                .sorted(SubmissionService::compareSubmissionRows)
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

        aiEvaluationService.prepareForEvaluation(submission);

        Submission saved = submissionRepository.save(submission);

        runAfterCommit(() -> scheduleAiEvaluation(saved));

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

    private boolean hasContentChanged(Submission submission, String text, String link) {
        return !Objects.equals(trimToNull(submission.getTextAnswer()), text)
                || !Objects.equals(trimToNull(submission.getFileLink()), link);
    }

    private void clearTeacherGrade(Submission submission) {
        submission.setTeacherScore(null);
        submission.setTeacherComment(null);
        submission.setGradedAt(null);
    }

    private void notifySubmissionChanged(Long submissionId, boolean isNewSubmission, boolean wasGraded) {
        if (isNewSubmission) {
            notificationService.submissionCreated(submissionId);
        } else if (wasGraded) {
            notificationService.submissionResubmittedAfterGrade(submissionId);
        } else {
            notificationService.submissionUpdated(submissionId);
        }
    }

    private void scheduleAiEvaluation(Submission submission) {
        if (aiEvaluationService.shouldEvaluate(submission)) {
            aiEvaluationService.evaluateAsync(submission.getId());
        }
    }

    private void runAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            action.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
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
                s.getAiStatus(), s.getAiErrorMessage(),
                computeStatus(s)
        );
    }

    private SubmissionShortResponse toShort(Long taskId, Long studentId, User student, Submission submission) {
        String studentName = student == null ? "Unknown" : student.getName();

        if (submission == null) {
            return new SubmissionShortResponse(
                    null,
                    taskId,
                    studentId,
                    studentName,
                    null,
                    false,
                    null,
                    null,
                    null,
                    null,
                    SubmissionStatus.NOT_SUBMITTED
            );
        }

        return new SubmissionShortResponse(
                submission.getId(),
                submission.getTaskId(),
                submission.getStudentId(),
                studentName,
                submission.getSubmittedAt(),
                submission.isLate(),
                submission.getTeacherScore(),
                submission.getGradedAt(),
                submission.getAiScore(),
                submission.getAiStatus(),
                computeStatus(submission)
        );
    }

    private boolean matchesSearch(SubmissionShortResponse row, String normalizedSearch) {
        if (normalizedSearch == null) return true;
        return row.studentName() != null
                && row.studentName().toLowerCase(Locale.ROOT).contains(normalizedSearch.toLowerCase(Locale.ROOT));
    }

    private static int compareSubmissionRows(SubmissionShortResponse left, SubmissionShortResponse right) {
        int leftSubmittedRank = left.submittedAt() == null ? 1 : 0;
        int rightSubmittedRank = right.submittedAt() == null ? 1 : 0;
        if (leftSubmittedRank != rightSubmittedRank) {
            return Integer.compare(leftSubmittedRank, rightSubmittedRank);
        }

        if (left.submittedAt() != null && right.submittedAt() != null) {
            int bySubmittedAt = Comparator.<Instant>reverseOrder().compare(left.submittedAt(), right.submittedAt());
            if (bySubmittedAt != 0) return bySubmittedAt;
        }

        return String.CASE_INSENSITIVE_ORDER.compare(
                Objects.toString(left.studentName(), ""),
                Objects.toString(right.studentName(), "")
        );
    }
}
