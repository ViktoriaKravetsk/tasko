package com.tasko.backend.notification;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "tasko.mail")
public class TaskoMailProperties {
    private boolean enabled = false;
    private String from;
    private String frontendBaseUrl = "http://localhost:5173";
}