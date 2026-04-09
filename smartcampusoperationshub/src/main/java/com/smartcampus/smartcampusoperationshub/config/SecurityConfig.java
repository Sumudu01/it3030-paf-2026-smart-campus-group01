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
            // 🔥 VERY IMPORTANT (disable CSRF for APIs)
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(authz -> authz
                // ✅ allow ALL API endpoints (Postman testing)
                .requestMatchers("/api/**").permitAll()

                // public routes
                .requestMatchers("/", "/login", "/oauth2/**", "/error", "/h2-console/**").permitAll()

                // role-based routes
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/technician/**").hasRole("TECHNICIAN")
                .requestMatchers("/staff/**").hasAnyRole("STAFFMEMBER", "ADMIN")

                // everything else needs login
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

            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
            );

        return http.build();
    }

    private OAuth2User loadOAuth2User(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        return customOAuth2UserService.loadUser(userRequest);
    }

    private OidcUser loadOidcUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = customOAuth2UserService.loadUser(userRequest);

        OidcUserService delegate = new OidcUserService();
        OidcUser oidcUser = delegate.loadUser(userRequest);

        return new DefaultOidcUser(
            oauth2User.getAuthorities(),
            oidcUser.getIdToken(),
            oidcUser.getUserInfo(),
            "name"
        );
    }
}