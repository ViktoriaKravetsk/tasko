package com.tasko.backend.user;

import com.tasko.backend.exception.UnauthenticatedException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@Transactional
class UserServiceTest {

    @Autowired UserService userService;

    private OAuth2User googlePrincipal(String sub, String email, String name, String picture) {
        Map<String, Object> attrs = Map.of(
                "sub", sub,
                "email", email,
                "name", name,
                "picture", picture
        );
        return new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                attrs,
                "sub"
        );
    }

    @Test
    void getOrCreate_throws401_whenPrincipalNull() {
        UnauthenticatedException ex = assertThrows(
                UnauthenticatedException.class,
                () -> userService.getOrCreateFromGoogle(null)
        );
        assertEquals("Unauthorized", ex.getMessage());
    }

    @Test
    void getOrCreate_createsUser_andReturnsSameOnNextLogin() {
        OAuth2User p = googlePrincipal("gid-123", "  TEST@Email.Com  ", "  Test Name  ", "http://pic");

        User u1 = userService.getOrCreateFromGoogle(p);
        User u2 = userService.getOrCreateFromGoogle(p);

        assertNotNull(u1.getId());
        assertEquals(u1.getId(), u2.getId());
        assertEquals("test@email.com", u1.getEmail());
        assertEquals("Test Name", u1.getName());
    }
}
