package com.tasko.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final String frontendBaseUrl;
    private final String allowedOrigins;

    public SecurityConfig(
            CustomOAuth2UserService customOAuth2UserService,
            @Value("${tasko.web.frontend-base-url:http://localhost:5173}") String frontendBaseUrl,
            @Value("${tasko.web.allowed-origins:http://localhost:5173}") String allowedOrigins
    ) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.frontendBaseUrl = frontendBaseUrl;
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        AuthenticationEntryPoint unauthorizedApiEntryPoint = new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED);

        http
                .csrf(csrf -> csrf.disable())

                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .exceptionHandling(exceptions -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                unauthorizedApiEntryPoint,
                                request -> request.getRequestURI().startsWith("/api/")
                        )
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/error", "/favicon.ico").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .anyRequest().authenticated()
                )

                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo.oidcUserService(customOAuth2UserService))
                        .defaultSuccessUrl(frontendBaseUrl, true)
                )

                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())

                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler((req, res, auth) -> res.setStatus(200))
                );

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(splitCsv(allowedOrigins));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    private static List<String> splitCsv(String value) {
        List<String> items = new ArrayList<>();
        for (String item : StringUtils.commaDelimitedListToStringArray(value)) {
            if (StringUtils.hasText(item)) {
                items.add(item.trim());
            }
        }
        return items;
    }
}
