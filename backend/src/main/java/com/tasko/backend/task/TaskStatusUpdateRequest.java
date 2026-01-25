package com.tasko.backend.task;

import com.tasko.backend.task.TaskStatus;

public record TaskStatusUpdateRequest(
        TaskStatus status
) {}
