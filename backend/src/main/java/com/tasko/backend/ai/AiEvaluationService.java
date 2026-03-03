package com.tasko.backend.ai;

import com.tasko.backend.exception.NotFoundException;
import com.tasko.backend.project.Project;
import com.tasko.backend.project.ProjectRepository;
import com.tasko.backend.submission.Submission;
import com.tasko.backend.submission.SubmissionRepository;
import com.tasko.backend.task.Task;
import com.tasko.backend.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiEvaluationService {

    private final AiProperties props;
    private final OpenAiClient openAiClient;

    private final SubmissionRepository submissionRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    @Async
    public void evaluateAsync(Long submissionId) {
        if (!props.isEnabled()) return;
        try {
            evaluateAndPersist(submissionId);
        } catch (Exception e) {
            log.warn("AI evaluation failed for submission {}: {}", submissionId, e.getMessage());
        }
    }

    @Transactional
    public Submission evaluateNow(Long submissionId) {
        if (!props.isEnabled()) {
            throw new AiProviderException("AI is disabled (tasko.ai.enabled=false)");
        }
        return evaluateAndPersist(submissionId);
    }

    @Transactional
    protected Submission evaluateAndPersist(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission not found"));

        Task task = taskRepository.findById(submission.getTaskId())
                .orElseThrow(() -> new NotFoundException("Task not found"));

        Project project = projectRepository.findById(task.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found"));

        AiEvaluationPrompt prompt = buildPrompt(project, task, submission);
        AiEvaluationResult result = openAiClient.evaluate(prompt);

        int max = task.getMaxScore() == null ? Integer.MAX_VALUE : task.getMaxScore();
        int bounded = Math.max(0, Math.min(result.aiScore(), max));

        submission.setAiScore(bounded);
        submission.setAiComment(clean(result.aiComment()));
        submission.setAiEvaluatedAt(Instant.now());

        return submissionRepository.save(submission);
    }

    private AiEvaluationPrompt buildPrompt(Project project, Task task, Submission submission) {
        String system =
                "You evaluate student submissions for a learning platform. " +
                        "Return ONLY JSON that matches the schema. " +
                        "Be fair and specific. Do not add extra keys.";

        String user =
                "Evaluate the student's submission.\n" +
                        "Project: " + safe(project.getName()) + "\n" +
                        "Task title: " + safe(task.getTitle()) + "\n" +
                        "Task description: " + safe(task.getDescription()) + "\n" +
                        "Max score: " + task.getMaxScore() + "\n\n" +
                        "Submission textAnswer:\n" + safe(submission.getTextAnswer()) + "\n\n" +
                        "Submission fileLink:\n" + safe(submission.getFileLink()) + "\n\n" +
                        "Rules:\n" +
                        "- aiScore must be an integer from 0 to Max score.\n" +
                        "- aiComment: 3-8 sentences: what's good, what's missing, and concrete next steps.\n";

        return new AiEvaluationPrompt(system, user);
    }

    private String safe(String s) {
        if (s == null || s.isBlank()) return "(empty)";
        return s.trim();
    }

    private String clean(String s) {
        if (s == null) return null;
        String v = s.trim();
        return v.isBlank() ? null : v;
    }
}