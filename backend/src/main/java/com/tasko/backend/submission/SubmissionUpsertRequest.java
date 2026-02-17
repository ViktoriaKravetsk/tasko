package com.tasko.backend.submission;

import jakarta.validation.constraints.Size;

public record SubmissionUpsertRequest(
        @Size(max = 20000) String textAnswer,
        @Size(max = 2048) String fileLink
) {}
