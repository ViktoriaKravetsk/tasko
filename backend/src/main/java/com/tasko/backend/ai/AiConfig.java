package com.tasko.backend.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
@EnableConfigurationProperties(AiProperties.class)
public class AiConfig {

    @Bean
    RestClient openAiRestClient(AiProperties props, RestClient.Builder builder) {
        var rf = new SimpleClientHttpRequestFactory();
        int ms = (int) Duration.ofSeconds(props.getTimeoutSeconds()).toMillis();
        rf.setConnectTimeout(ms);
        rf.setReadTimeout(ms);

        String key = props.getOpenaiApiKey() == null ? "" : props.getOpenaiApiKey();

        return builder
                .baseUrl(props.getBaseUrl())
                .requestFactory(rf)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + key)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Bean
    OpenAiClient openAiClient(AiProperties props, RestClient openAiRestClient, ObjectMapper objectMapper) {
        return new OpenAiClient(props, openAiRestClient, objectMapper);
    }
}