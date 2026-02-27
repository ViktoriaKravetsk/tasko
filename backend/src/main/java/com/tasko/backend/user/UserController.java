package com.tasko.backend.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/api/me")
    public UserResponse me(@AuthenticationPrincipal OAuth2User principal) {
        return userService.me(principal);
    }

    @PatchMapping("/api/me")
    public UserResponse updateProfile(
            @AuthenticationPrincipal OAuth2User principal,
            @Valid @RequestBody UserUpdateRequest req
    ) {
        return userService.updateProfile(principal, req);
    }
}
