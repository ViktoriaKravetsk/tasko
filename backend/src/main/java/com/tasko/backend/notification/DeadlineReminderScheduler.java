package com.tasko.backend.notification;

import com.tasko.backend.project.*;
import com.tasko.backend.submission.*;
import com.tasko.backend.task.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DeadlineReminderScheduler {

    private final TaskRepository taskRepository;
    private final ProjectMemberRepository memberRepository;
    private final SubmissionRepository submissionRepository;
    private final NotificationService notificationService;
    private final TaskoMailProperties props;

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional(readOnly = true)
    public void sendDeadlineReminders() {
        if (!props.isEnabled()) return;

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Task> tasks = taskRepository.findAllByDeadline(tomorrow);

        for (Task task : tasks) {
            List<ProjectMember> students =
                    memberRepository.findAllByProjectIdAndRole(task.getProjectId(), ProjectRole.STUDENT);

            for (ProjectMember m : students) {
                Long studentId = m.getUserId();

                Submission s = submissionRepository.findByTaskIdAndStudentId(task.getId(), studentId).orElse(null);

                boolean shouldRemind = (s == null) || (s.getTeacherScore() == null);
                if (shouldRemind) {
                    notificationService.deadlineReminder(task.getId(), studentId);
                }
            }
        }
    }
}