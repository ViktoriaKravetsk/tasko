package com.tasko.backend.user;

import com.tasko.backend.CurrentUser;
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
        String name = trimToNull(getStringAttr(principal, "name"));
        String picture = trimToNull(getStringAttr(principal, "picture"));

        if (googleId == null) throw new BadRequestException("Invalid Google principal: missing sub");
        if (email == null) throw new BadRequestException("Invalid Google principal: missing email");

        String normalizedEmail = email.toLowerCase();
        String finalName = (name != null) ? name : normalizedEmail;

        User u = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> User.builder()
                        .googleId(googleId)
                        .enabled(true)
                        .build());

        u.setEmail(normalizedEmail);
        u.setName(finalName);
        u.setAvatarUrl(picture);

        return userRepository.save(u);
    }

    @Transactional
    public UserResponse me(OAuth2User principal) {
        User u = getOrCreateFromGoogle(principal);
        return new UserResponse(u.getId(), u.getEmail(), u.getName(), u.getAvatarUrl(), u.getCreatedAt());
    }

    private static String getStringAttr(OAuth2User principal, String key) {
        Object v = principal.getAttribute(key);
        if (v == null) return null;

        String s = String.valueOf(v);
        return "null".equalsIgnoreCase(s) ? null : s;
    }
}
