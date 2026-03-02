package com.tasko.backend.task;

import com.tasko.backend.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects/{projectId}/tasks")
@PreAuthorize("isAuthenticated()")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public TaskResponse create(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @Valid @RequestBody TaskCreateRequest req
    ) {
        return taskService.create(principal.getUserId(), projectId, req);
    }

    @GetMapping
    public List<TaskShortResponse> list(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId
    ) {
        return taskService.list(principal.getUserId(), projectId);
    }

    @GetMapping("/{taskId}")
    public TaskResponse getById(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        return taskService.getById(principal.getUserId(), projectId, taskId);
    }

    @PutMapping("/{taskId}")
    public TaskResponse update(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody TaskUpdateRequest req
    ) {
        return taskService.update(principal.getUserId(), projectId, taskId, req);
    }

    @PatchMapping("/{taskId}/status")
    public TaskResponse updateStatus(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody TaskStatusUpdateRequest req
    ) {
        return taskService.updateStatus(principal.getUserId(), projectId, taskId, req);
    }

    @DeleteMapping("/{taskId}")
    public void delete(
            @AuthenticationPrincipal CurrentUser principal,
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        taskService.delete(principal.getUserId(), projectId, taskId);
    }
}
