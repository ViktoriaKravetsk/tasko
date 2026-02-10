package com.tasko.backend.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User getOrCreateFromGoogle(OAuth2User principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        String googleId = principal.getAttribute("sub");
        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");
        String picture = principal.getAttribute("picture");

        if (googleId == null || googleId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google principal");
        }
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email missing in Google principal");
        }

        String finalName = (name != null && !name.isBlank()) ? name.trim() : email.trim();

        return userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .googleId(googleId)
                                .email(email.trim().toLowerCase())
                                .name(finalName)
                                .avatarUrl(picture)
                                .enabled(true)
                                .build()
                ));
    }
}
