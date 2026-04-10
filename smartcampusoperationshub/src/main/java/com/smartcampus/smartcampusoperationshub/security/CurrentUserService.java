package com.smartcampus.smartcampusoperationshub.security;

import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.repository.UserRepository;
import com.smartcampus.smartcampusoperationshub.service.CustomOAuth2UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User requireUser() {
        User user = getUserOrNull();
        if (user == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return user;
    }

    public User getUserOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof CustomOAuth2UserPrincipal customPrincipal) {
            return customPrincipal.getUser();
        }

        if (principal instanceof OAuth2User oauth2User) {
            String email = oauth2User.getAttribute("email");
            if (email == null || email.isBlank()) return null;
            return userRepository.findByEmail(email).orElse(null);
        }

        return null;
    }
}

