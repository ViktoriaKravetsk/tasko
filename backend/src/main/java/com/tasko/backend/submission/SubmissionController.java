package com.tasko.backend.submission;

import com.tasko.backend.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects/{projectId}/tasks/{taskId}")
@PreAuthorize("isAuthenticated()")
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping("/submission")
    public SubmissionResponse upsertMy(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody SubmissionUpsertRequest req
    ) {
        return submissionService.upsertMy(principal.getUserId(), projectId, taskId, req);
    }

    @GetMapping("/submission/me")
    public SubmissionResponse getMy(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        return submissionService.getMy(principal.getUserId(), projectId, taskId);
    }

    @GetMapping("/submissions")
    public List<SubmissionShortResponse> listForOwner(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        return submissionService.listForOwner(principal.getUserId(), projectId, taskId);
    }

    @GetMapping("/submissions/{submissionId}")
    public SubmissionResponse getForOwner(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @PathVariable Long submissionId
    ) {
        return submissionService.getForOwner(principal.getUserId(), projectId, taskId, submissionId);
    }

    @PutMapping("/submissions/{submissionId}/grade")
    public SubmissionResponse grade(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @PathVariable Long submissionId,
            @Valid @RequestBody SubmissionGradeRequest req
    ) {
        return submissionService.grade(principal.getUserId(), projectId, taskId, submissionId, req);
    }

    @PostMapping("/submissions/{submissionId}/ai-evaluate")
    public SubmissionResponse reEvaluateAi(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @PathVariable Long submissionId
    ) {
        return submissionService.reEvaluateAi(principal.getUserId(), projectId, taskId, submissionId);
    }
}