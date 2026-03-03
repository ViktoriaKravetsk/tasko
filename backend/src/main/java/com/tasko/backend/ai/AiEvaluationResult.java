package com.tasko.backend.ai;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public record AiEvaluationResult(int aiScore, String aiComment) {

    @JsonCreator
    public AiEvaluationResult(
            @JsonProperty("aiScore") int aiScore,
            @JsonProperty("aiComment") String aiComment
    ) {
        this.aiScore = aiScore;
        this.aiComment = aiComment;
    }

    public static Map<String, Object> jsonSchema() {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("type", "object");

        Map<String, Object> props = new LinkedHashMap<>();

        Map<String, Object> score = new LinkedHashMap<>();
        score.put("type", "integer");
        score.put("minimum", 0);
        props.put("aiScore", score);

        Map<String, Object> comment = new LinkedHashMap<>();
        comment.put("type", "string");
        comment.put("minLength", 1);
        props.put("aiComment", comment);

        root.put("properties", props);
        root.put("required", List.of("aiScore", "aiComment"));
        root.put("additionalProperties", false);

        return root;
    }
}