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

import java.util.Collections;

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
                .ignoringRequestMatchers("/h2-console/**")
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
        // First load the user using our custom service to save to database (with database role)
        OAuth2User oauth2User = customOAuth2UserService.loadUser(userRequest);
        
        // Now convert to OidcUser by delegating to the default OidcUserService
        OidcUserService delegate = new OidcUserService();
        OidcUser oidcUser = delegate.loadUser(userRequest);
        
        // Return a combined user that uses OUR custom authorities (database role) NOT Google's scopes
        // This ensures the frontend gets exact UserRole (STUDENT, STAFFMEMBER, ADMIN, TECHNICIAN)
        // instead of SCOPE_openid or other OAuth2 scopes
        return new DefaultOidcUser(
            oauth2User.getAuthorities(),  // Use database role authorities
            oidcUser.getIdToken(),
            oidcUser.getUserInfo(),
            "name"
        );
    }
}
