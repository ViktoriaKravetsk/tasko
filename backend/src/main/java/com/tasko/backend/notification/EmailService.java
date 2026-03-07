package com.tasko.backend.notification;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TaskoMailProperties props;

    public void sendHtml(String to, String subject, String html) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_NO,
                    StandardCharsets.UTF_8.name()
            );

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);

            if (props.getFrom() != null && !props.getFrom().isBlank()) {
                helper.setFrom(props.getFrom().trim());
            }

            mailSender.send(message);
        } catch (Exception e) {
            throw new MailSendingException("Failed to send email to " + to, e);
        }
    }
}