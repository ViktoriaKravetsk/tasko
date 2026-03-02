package com.tasko.backend;

import com.tasko.backend.CurrentUser;
import com.tasko.backend.user.User;
import com.tasko.backend.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends OidcUserService {

    private final UserService userService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) {

        OidcUser oidcUser = super.loadUser(userRequest);

        User user = userService.getOrCreateFromGoogle(oidcUser);

        return new CurrentUser(user.getId(), oidcUser);
    }
}