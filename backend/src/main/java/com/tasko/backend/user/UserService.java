package com.tasko.backend.user;

import com.tasko.backend.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User getOrCreateFromGoogle(OAuth2User principal) {
        if (principal == null) {
            throw new UnauthenticatedException();
        }

        String googleId = trimToNull(getStringAttr(principal, "sub"));
        String email = trimToNull(getStringAttr(principal, "email"));
        String name = trimToNull(getStringAttr(principal, "name"));
        String picture = trimToNull(getStringAttr(principal, "picture"));

        if (googleId == null) {
            throw new BadRequestException("Invalid Google principal: missing sub");
        }
        if (email == null) {
            throw new BadRequestException("Invalid Google principal: missing email");
        }

        String normalizedEmail = email.toLowerCase();
        String finalName = (name != null) ? name : normalizedEmail;

        return userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .googleId(googleId)
                                .email(normalizedEmail)
                                .name(finalName)
                                .avatarUrl(picture)
                                .enabled(true)
                                .build()
                ));
    }

    @Transactional(readOnly = true)
    public User getMe(Long userId) {
        if (userId == null) {
            throw new UnauthenticatedException();
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    private static String getStringAttr(OAuth2User principal, String key) {
        Object v = principal.getAttribute(key);
        if (v == null) return null;

        String s = String.valueOf(v);
        return "null".equalsIgnoreCase(s) ? null : s;
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String v = s.trim();
        return v.isBlank() ? null : v;
    }
}
