package com.tasko.backend.project;

public record ProjectProgressResponse(
        Long projectId,
        int earned,
        int total
) {}
