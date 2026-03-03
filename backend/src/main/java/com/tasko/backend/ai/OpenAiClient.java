package com.tasko.backend.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.RestClient;

import java.util.List;

@RequiredArgsConstructor
public class OpenAiClient {

    private final AiProperties props;
    private final RestClient rest;
    private final ObjectMapper mapper;

    public AiEvaluationResult evaluate(AiEvaluationPrompt prompt) {
        if (props.getOpenaiApiKey() == null || props.getOpenaiApiKey().isBlank()) {
            throw new AiProviderException("OpenAI API key is not configured (tasko.ai.openai-api-key / OPENAI_API_KEY)");
        }

        OpenAiResponsesRequest body = OpenAiResponsesRequest.fromPrompt(props.getModel(), prompt);

        OpenAiResponsesResponse resp = rest.post()
                .uri("/responses")
                .body(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new AiProviderException("OpenAI error: HTTP " + res.getStatusCode());
                })
                .body(OpenAiResponsesResponse.class);

        if (resp == null) throw new AiProviderException("Empty response from OpenAI");

        String json = resp.firstOutputText();
        if (json == null || json.isBlank()) throw new AiProviderException("OpenAI returned empty content");

        try {
            return mapper.readValue(json, AiEvaluationResult.class);
        } catch (Exception e) {
            throw new AiProviderException("Failed to parse OpenAI JSON: " + e.getMessage());
        }
    }

    record OpenAiResponsesRequest(
            String model,
            Object input,
            TextSpec text,
            @JsonProperty("store") Boolean store
    ) {
        static OpenAiResponsesRequest fromPrompt(String model, AiEvaluationPrompt p) {
            List<Message> messages = List.of(
                    new Message("system", p.system()),
                    new Message("user", p.user())
            );

            return new OpenAiResponsesRequest(
                    model,
                    messages,
                    TextSpec.jsonSchema(AiEvaluationResult.jsonSchema()),
                    false
            );
        }
    }

    record Message(String role, String content) {}

    record TextSpec(FormatSpec format) {
        static TextSpec jsonSchema(Object schema) {
            return new TextSpec(FormatSpec.jsonSchema(schema));
        }
    }

    record FormatSpec(
            String type,
            String name,
            boolean strict,
            Object schema
    ) {
        static FormatSpec jsonSchema(Object schema) {
            return new FormatSpec("json_schema", "ai_evaluation", true, schema);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class OpenAiResponsesResponse {
        public List<OutputItem> output;

        public String firstOutputText() {
            if (output == null) return null;
            for (OutputItem item : output) {
                if (!"message".equals(item.type) || item.content == null) continue;
                for (ContentItem c : item.content) {
                    if ("output_text".equals(c.type) && c.text != null) return c.text;
                }
            }
            return null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class OutputItem {
        public String type;
        public List<ContentItem> content;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ContentItem {
        public String type;
        public String text;
    }
}