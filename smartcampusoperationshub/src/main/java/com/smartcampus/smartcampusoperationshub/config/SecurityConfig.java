package com.smartcampus.smartcampusoperationshub.config;

import com.smartcampus.smartcampusoperationshub.service.CustomOAuth2UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/", "/login", "/oauth2/**", "/error", "/h2-console/**", "/api/debug/**").permitAll()

                // ✅ Allow ticket APIs for Postman/frontend testing
                .requestMatchers("/api/tickets/**").permitAll()

                // REST API endpoints - /api/auth/user is available to all authenticated users
                .requestMatchers("/api/auth/user").authenticated()
                .requestMatchers("/api/auth/profile").authenticated()

                // Admin-only REST endpoints
                .requestMatchers("/api/auth/user/*/role").hasRole("ADMIN")
                .requestMatchers("/api/auth/user/*").hasRole("ADMIN")
                .requestMatchers("/api/auth/users").hasRole("ADMIN")
                .requestMatchers("/api/auth/user/*/permissions").hasRole("ADMIN")
                .requestMatchers("/api/auth/user/*/grant-all-permissions").hasRole("ADMIN")
                .requestMatchers("/api/auth/permissions").hasRole("ADMIN")
                .requestMatchers("/api/auth/user/*/enable").hasRole("ADMIN")

                // Thymeleaf admin routes
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/technician/**").hasRole("TECHNICIAN")
                .requestMatchers("/staff/**").hasAnyRole("STAFFMEMBER", "ADMIN")

                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(this::loadOAuth2User)
                    .oidcUserService(this::loadOidcUser)
                )
                .defaultSuccessUrl("/home", true)
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
            )
            .sessionManagement(session -> session
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
            )
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/h2-console/**", "/api/tickets/**")
            )
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
            );

        return http.build();
    }

    private OAuth2User loadOAuth2User(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = customOAuth2UserService.loadUser(userRequest);
        return oauth2User;
    }

    private OidcUser loadOidcUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = customOAuth2UserService.loadUser(userRequest);

        System.out.println("DEBUG loadOidcUser returning authorities: " + oauth2User.getAuthorities());

        OidcUserService delegate = new OidcUserService();
        OidcUser oidcUser = delegate.loadUser(userRequest);

        DefaultOidcUser result = new DefaultOidcUser(
            oauth2User.getAuthorities(),
            oidcUser.getIdToken(),
            oidcUser.getUserInfo(),
            "name"
        );

        System.out.println("DEBUG DefaultOidcUser authorities: " + result.getAuthorities());

        return result;
    }
}