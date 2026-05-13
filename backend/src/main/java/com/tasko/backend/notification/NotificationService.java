package com.tasko.backend.notification;

import com.tasko.backend.project.*;
import com.tasko.backend.submission.*;
import com.tasko.backend.task.*;
import com.tasko.backend.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int MAX_RETRIES = 3;

    private final TaskoMailProperties props;
    private final EmailService emailService;

    private final NotificationLogRepository logRepository;
    private final NotificationCenterService notificationCenterService;

    private final TaskRepository taskRepository;
    private final SubmissionRepository submissionRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;

    @Async
    @Transactional
    public void taskCreated(Long taskId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) return;

        Project project = projectRepository.findById(task.getProjectId()).orElse(null);
        if (project == null) return;

        List<ProjectMember> students =
                memberRepository.findAllByProjectIdAndRole(project.getId(), ProjectRole.STUDENT);

        for (ProjectMember m : students) {
            User u = userRepository.findById(m.getUserId()).orElse(null);
            if (u == null) continue;

            String href = "/projects/" + project.getId() + "/tasks/" + task.getId();
            notificationCenterService.create(
                    u.getId(),
                    NotificationType.TASK_CREATED,
                    "New task added",
                    project.getName() + ": " + task.getTitle(),
                    href,
                    task.getId()
            );

            if (!props.isEnabled() || u.getEmail() == null || u.getEmail().isBlank()) continue;

            String to = u.getEmail();
            String subject = "New task in project \"" + project.getName() + "\"";
            String link = props.getFrontendBaseUrl() + href;

            String html = templateTaskCreated(
                    u.getName(), project.getName(), task.getTitle(), task.getDeadline(), task.getMaxScore(), link
            );

            sendWithLogging(NotificationType.TASK_CREATED, to, task.getId(), subject, html);
        }
    }

    @Async
    @Transactional
    public void submissionGraded(Long submissionId) {
        Submission s = submissionRepository.findById(submissionId).orElse(null);
        if (s == null) return;

        Task task = taskRepository.findById(s.getTaskId()).orElse(null);
        if (task == null) return;

        Project project = projectRepository.findById(task.getProjectId()).orElse(null);
        if (project == null) return;

        User student = userRepository.findById(s.getStudentId()).orElse(null);
        if (student == null) return;

        String href = "/projects/" + project.getId() + "/tasks/" + task.getId();
        notificationCenterService.create(
                student.getId(),
                NotificationType.TASK_GRADED,
                "Task graded",
                task.getTitle() + ": " + (s.getTeacherScore() == null ? "-" : s.getTeacherScore()) + " / " + task.getMaxScore(),
                href,
                s.getId()
        );

        if (!props.isEnabled() || student.getEmail() == null || student.getEmail().isBlank()) return;

        String to = student.getEmail();
        String subject = "Your submission has been graded";
        String link = props.getFrontendBaseUrl() + href;

        String html = templateTaskGraded(
                student.getName(),
                project.getName(),
                task.getTitle(),
                s.getTeacherScore(),
                task.getMaxScore(),
                s.getTeacherComment(),
                s.getAiComment(),
                link
        );

        sendWithLogging(NotificationType.TASK_GRADED, to, s.getId(), subject, html);
    }

    @Async
    @Transactional
    public void submissionCreated(Long submissionId) {
        submissionChanged(
                submissionId,
                NotificationType.SUBMISSION_CREATED,
                "New submission",
                "submitted work for review."
        );
    }

    @Async
    @Transactional
    public void submissionUpdated(Long submissionId) {
        submissionChanged(
                submissionId,
                NotificationType.SUBMISSION_UPDATED,
                "Submission updated",
                "updated a submitted work before grading."
        );
    }

    @Async
    @Transactional
    public void submissionResubmittedAfterGrade(Long submissionId) {
        submissionChanged(
                submissionId,
                NotificationType.SUBMISSION_RESUBMITTED_AFTER_GRADE,
                "Graded submission updated",
                "updated a graded work. The previous grade was cleared and this submission needs review again."
        );
    }

    private void submissionChanged(Long submissionId, NotificationType type, String subjectPrefix, String actionText) {
        Submission s = submissionRepository.findById(submissionId).orElse(null);
        if (s == null) return;

        Task task = taskRepository.findById(s.getTaskId()).orElse(null);
        if (task == null) return;

        Project project = projectRepository.findById(task.getProjectId()).orElse(null);
        if (project == null) return;

        User owner = userRepository.findById(project.getOwnerId()).orElse(null);
        if (owner == null) return;

        User student = userRepository.findById(s.getStudentId()).orElse(null);
        String studentName = student == null ? "Unknown student" : student.getName();

        String href = "/projects/" + project.getId()
                + "/tasks/" + task.getId()
                + "/submissions/" + s.getId();

        notificationCenterService.create(
                owner.getId(),
                type,
                subjectPrefix,
                studentName + " " + actionText + " Task: " + task.getTitle(),
                href,
                s.getId()
        );

        if (!props.isEnabled() || owner.getEmail() == null || owner.getEmail().isBlank()) return;

        String to = owner.getEmail();
        String subject = subjectPrefix + ": " + task.getTitle();
        String link = props.getFrontendBaseUrl() + href;

        String html = templateSubmissionChanged(
                owner.getName(),
                studentName,
                project.getName(),
                task.getTitle(),
                actionText,
                s.isLate(),
                s.getSubmittedAt(),
                link
        );

        sendWithLogging(type, to, s.getId(), subject, html);
    }

    @Async
    @Transactional
    public void deadlineReminder(Long taskId, Long studentId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) return;

        Project project = projectRepository.findById(task.getProjectId()).orElse(null);
        if (project == null) return;

        User student = userRepository.findById(studentId).orElse(null);
        if (student == null) return;

        String href = "/projects/" + project.getId() + "/tasks/" + task.getId();
        notificationCenterService.create(
                student.getId(),
                NotificationType.DEADLINE_REMINDER,
                "Deadline tomorrow",
                project.getName() + ": " + task.getTitle(),
                href,
                task.getId()
        );

        if (!props.isEnabled() || student.getEmail() == null || student.getEmail().isBlank()) return;

        String to = student.getEmail();
        String subject = "Deadline tomorrow: " + task.getTitle();
        String link = props.getFrontendBaseUrl() + href;

        String html = templateDeadlineReminder(
                student.getName(), project.getName(), task.getTitle(), task.getDeadline(), link
        );

        sendWithLogging(NotificationType.DEADLINE_REMINDER, to, task.getId(), subject, html);
    }

    private void sendWithLogging(NotificationType type, String to, Long relatedId, String subject, String html) {
        int attempt = 0;

        while (true) {
            try {
                emailService.sendHtml(to, subject, html);

                logRepository.save(NotificationLog.builder()
                        .type(type)
                        .receiverEmail(to)
                        .status(NotificationStatus.SENT)
                        .errorMessage(null)
                        .relatedEntityId(relatedId)
                        .retryCount(attempt)
                        .sentAt(Instant.now())
                        .build());
                return;
            } catch (Exception e) {
                attempt++;

                if (attempt >= MAX_RETRIES) {
                    logRepository.save(NotificationLog.builder()
                            .type(type)
                            .receiverEmail(to)
                            .status(NotificationStatus.FAILED)
                            .errorMessage(shortErr(e))
                            .relatedEntityId(relatedId)
                            .retryCount(attempt)
                            .sentAt(null)
                            .build());
                    return;
                }
            }
        }
    }

    private String shortErr(Exception e) {
        String msg = e.getMessage();
        if (msg == null) msg = e.getClass().getSimpleName();
        msg = msg.trim();
        return msg.length() > 2000 ? msg.substring(0, 2000) : msg;
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String templateTaskCreated(String name, String projectName, String taskTitle, LocalDate deadline, Integer maxScore, String link) {
        return """
                <div style="font-family:Arial,sans-serif;line-height:1.5">
                  <h2>New task in Tasko</h2>
                  <p>Hi %s,</p>
                  <p>A new task was created in <b>%s</b>:</p>
                  <ul>
                    <li><b>Task:</b> %s</li>
                    <li><b>Deadline:</b> %s</li>
                    <li><b>Max score:</b> %s</li>
                  </ul>
                  <p><a href="%s" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;text-decoration:none;border-radius:8px">Open task</a></p>
                  <hr/>
                  <p style="color:#666;font-size:12px">You received this email because you are a member of project "%s" in Tasko.</p>
                </div>
                """.formatted(
                esc(name),
                esc(projectName),
                esc(taskTitle),
                deadline == null ? "—" : deadline.toString(),
                maxScore == null ? "—" : maxScore.toString(),
                link,
                esc(projectName)
        );
    }

    private String templateTaskGraded(String name, String projectName, String taskTitle, Integer score, Integer maxScore, String teacherComment, String aiComment, String link) {
        return """
                <div style="font-family:Arial,sans-serif;line-height:1.5">
                  <h2>Your submission has been graded</h2>
                  <p>Hi %s,</p>
                  <p>Project: <b>%s</b></p>
                  <p>Task: <b>%s</b></p>
                  <p><b>Score:</b> %s / %s</p>
                  %s
                  %s
                  <p><a href="%s" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;text-decoration:none;border-radius:8px">View feedback</a></p>
                  <hr/>
                  <p style="color:#666;font-size:12px">You received this email because you are a member of project "%s" in Tasko.</p>
                </div>
                """.formatted(
                esc(name),
                esc(projectName),
                esc(taskTitle),
                score == null ? "—" : score.toString(),
                maxScore == null ? "—" : maxScore.toString(),
                teacherComment == null ? "" : "<p><b>Teacher comment:</b><br/>" + esc(teacherComment) + "</p>",
                aiComment == null ? "" : "<p><b>AI feedback:</b><br/>" + esc(aiComment) + "</p>",
                link,
                esc(projectName)
        );
    }

    private String templateSubmissionChanged(
            String ownerName,
            String studentName,
            String projectName,
            String taskTitle,
            String actionText,
            boolean late,
            Instant submittedAt,
            String link
    ) {
        return """
                <div style="font-family:Arial,sans-serif;line-height:1.5">
                  <h2>Submission update in Tasko</h2>
                  <p>Hi %s,</p>
                  <p><b>%s</b> %s</p>
                  <ul>
                    <li><b>Project:</b> %s</li>
                    <li><b>Task:</b> %s</li>
                    <li><b>Submitted at:</b> %s</li>
                    <li><b>Late:</b> %s</li>
                  </ul>
                  <p><a href="%s" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;text-decoration:none;border-radius:8px">Review submission</a></p>
                  <hr/>
                  <p style="color:#666;font-size:12px">You received this email because you own project "%s" in Tasko.</p>
                </div>
                """.formatted(
                esc(ownerName),
                esc(studentName),
                esc(actionText),
                esc(projectName),
                esc(taskTitle),
                submittedAt == null ? "-" : submittedAt.toString(),
                late ? "yes" : "no",
                link,
                esc(projectName)
        );
    }

    private String templateDeadlineReminder(String name, String projectName, String taskTitle, LocalDate deadline, String link) {
        return """
                <div style="font-family:Arial,sans-serif;line-height:1.5">
                  <h2>Deadline reminder</h2>
                  <p>Hi %s,</p>
                  <p>Deadline is tomorrow for:</p>
                  <p><b>%s</b> (Project: %s)</p>
                  <p><b>Deadline:</b> %s</p>
                  <p><a href="%s" style="display:inline-block;padding:10px 14px;background:#111;color:#fff;text-decoration:none;border-radius:8px">Submit now</a></p>
                  <hr/>
                  <p style="color:#666;font-size:12px">You received this email because you are a member of project "%s" in Tasko.</p>
                </div>
                """.formatted(
                esc(name),
                esc(taskTitle),
                esc(projectName),
                deadline == null ? "—" : deadline.toString(),
                link,
                esc(projectName)
        );
    }
}
