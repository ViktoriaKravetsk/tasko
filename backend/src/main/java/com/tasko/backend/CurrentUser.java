package com.tasko.backend;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

public class CurrentUser implements OAuth2User {

    private final Long userId;
    private final OAuth2User delegate;

    public CurrentUser(Long userId, OAuth2User delegate) {
        this.userId = userId;
        this.delegate = delegate;
    }

    public Long getUserId() {
        return userId;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return delegate.getAuthorities();
    }

    @Override
    public String getName() {
        Object sub = delegate.getAttribute("sub");
        return sub != null ? String.valueOf(sub) : delegate.getName();
    }
}
