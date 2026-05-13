package com.tasko.backend.submission;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "submissions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_submissions_task_student",
                columnNames = {"task_id", "student_id"}
        ),
        indexes = {
                @Index(name = "idx_submissions_task_id", columnList = "task_id"),
                @Index(name = "idx_submissions_student_id", columnList = "student_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "text_answer")
    private String textAnswer;

    @Column(name = "file_link")
    private String fileLink;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "late", nullable = false)
    private boolean late;

    @Column(name = "teacher_score")
    private Integer teacherScore;

    @Column(name = "teacher_comment")
    private String teacherComment;

    @Column(name = "graded_at")
    private Instant gradedAt;

    @Column(name = "ai_score")
    private Integer aiScore;

    @Column(name = "ai_comment")
    private String aiComment;

    @Column(name = "ai_evaluated_at")
    private Instant aiEvaluatedAt;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "ai_status", nullable = false, length = 32)
    private AiEvaluationStatus aiStatus = AiEvaluationStatus.PENDING;

    @Column(name = "ai_error_message")
    private String aiErrorMessage;
}
