package com.tasko.backend.user;

import com.tasko.backend.exception.BadRequestException;
import com.tasko.backend.exception.UnauthenticatedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static org.apache.logging.log4j.util.Strings.trimToNull;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User getOrCreateFromGoogle(OAuth2User principal) {
        if (principal == null) throw new UnauthenticatedException();

        String googleId = trimToNull(getStringAttr(principal, "sub"));
        String email = trimToNull(getStringAttr(principal, "email"));
        String googleName = trimToNull(getStringAttr(principal, "name"));
        String googlePicture = trimToNull(getStringAttr(principal, "picture"));

        if (googleId == null) throw new BadRequestException("Invalid Google principal: missing sub");
        if (email == null) throw new BadRequestException("Invalid Google principal: missing email");

        String normalizedEmail = email.toLowerCase();

        User u = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(normalizedEmail))
                .orElseGet(() -> User.builder()
                        .googleId(googleId)
                        .enabled(true)
                        .build());

        u.setGoogleId(googleId);
        u.setEmail(normalizedEmail);

        if (u.getName() == null || u.getName().isBlank()) {
            String finalName = (googleName != null) ? googleName : normalizedEmail;
            u.setName(finalName);
        }

        if (u.getAvatarUrl() == null || u.getAvatarUrl().isBlank()) {
            u.setAvatarUrl(googlePicture);
        }

        return userRepository.save(u);
    }

    @Transactional
    public UserResponse me(OAuth2User principal) {
        User u = getOrCreateFromGoogle(principal);
        return new UserResponse(u.getId(), u.getEmail(), u.getName(), u.getAvatarUrl(), u.getCreatedAt());
    }

    @Transactional
    public UserResponse updateProfile(OAuth2User principal, UserUpdateRequest req) {
        if (principal == null) throw new UnauthenticatedException();

        String googleId = trimToNull(getStringAttr(principal, "sub"));
        if (googleId == null) throw new BadRequestException("Invalid Google principal: missing sub");

        User u = userRepository.findByGoogleId(googleId)
                .orElseThrow(UnauthenticatedException::new);

        if (req == null) throw new BadRequestException("Request is required");

        if (req.name() != null) {
            String name = trimToNull(req.name());
            if (name == null) throw new BadRequestException("Name cannot be empty");
            u.setName(name);
        }

        if (req.avatarUrl() != null) {
            u.setAvatarUrl(trimToNull(req.avatarUrl()));
        }

        User saved = userRepository.save(u);
        return new UserResponse(saved.getId(), saved.getEmail(), saved.getName(), saved.getAvatarUrl(), saved.getCreatedAt());
    }

    private static String getStringAttr(OAuth2User principal, String key) {
        Object v = principal.getAttribute(key);
        if (v == null) return null;

        String s = String.valueOf(v);
        return "null".equalsIgnoreCase(s) ? null : s;
    }
}
