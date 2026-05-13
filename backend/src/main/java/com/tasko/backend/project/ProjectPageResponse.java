package com.tasko.backend.project;

import java.util.List;

public record ProjectPageResponse(
        List<ProjectResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
}
