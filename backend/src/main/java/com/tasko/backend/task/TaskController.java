package com.tasko.backend.task;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/projects/{projectId}/tasks")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public TaskResponse create(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long projectId,
            @RequestBody TaskCreateRequest req
    ) {
        return taskService.create(userId, projectId, req);
    }

    @GetMapping
    public List<TaskShortResponse> list(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long projectId
    ) {
        return taskService.list(userId, projectId);
    }

    @GetMapping("/{taskId}")
    public TaskResponse getById(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        return taskService.getById(userId, projectId, taskId);
    }

    @PutMapping("/{taskId}")
    public TaskResponse update(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestBody TaskUpdateRequest req
    ) {
        return taskService.update(userId, projectId, taskId, req);
    }

    @PatchMapping("/{taskId}/status")
    public TaskResponse updateStatus(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestBody TaskStatusUpdateRequest req
    ) {
        return taskService.updateStatus(userId, projectId, taskId, req);
    }

    @DeleteMapping("/{taskId}")
    public void delete(
            @RequestHeader("X-USER-ID") Long userId,
            @PathVariable Long projectId,
            @PathVariable Long taskId
    ) {
        taskService.delete(userId, projectId, taskId);
    }
}
