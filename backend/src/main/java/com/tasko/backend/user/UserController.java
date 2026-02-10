package com.tasko.backend.user;

import com.tasko.backend.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal CurrentUser principal) {
        User user = userRepository.findById(principal.getUserId())
                .orElseThrow();

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getCreatedAt()
        );
    }
}
