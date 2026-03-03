package com.tasko.backend.ai;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "tasko.ai")
public class AiProperties {

    private boolean enabled = false;

    private String provider = "openai";

    private String openaiApiKey;

    private String model = "gpt-5";

    private String baseUrl = "https://api.openai.com/v1";

    private int timeoutSeconds = 30;
}