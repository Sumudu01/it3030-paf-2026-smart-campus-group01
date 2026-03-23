package com.smartcampus.smartcampusoperationshub.service;

import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.model.UserRole;
import com.smartcampus.smartcampusoperationshub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        
        // Admin email that gets automatic admin access
        final String ADMIN_EMAIL = "sumuduwijeratne2002@gmail.com";
        
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            // New user - determine role based on email
            UserRole defaultRole = UserRole.STUDENT;
            boolean rolePending = true;
            
            // Check if this is the admin email
            if (ADMIN_EMAIL.equalsIgnoreCase(email)) {
                defaultRole = UserRole.ADMIN;
                rolePending = false;  // Admin doesn't need to select role
            }
            
            user = new User(email, name, picture, defaultRole);
            user.setLastLoginAt(LocalDateTime.now());
            user.setRolePending(rolePending);
            userRepository.save(user);
        } else {
            // Existing user - update last login
            user.setLastLoginAt(LocalDateTime.now());
            user.setName(name);
            user.setPicture(picture);
            
            // Grant admin role if logging in with admin email and not already admin
            if (ADMIN_EMAIL.equalsIgnoreCase(email) && user.getRole() != UserRole.ADMIN) {
                user.setRole(UserRole.ADMIN);
                user.setRolePending(false);
            }
            
            userRepository.save(user);
        }
        
        return new CustomOAuth2UserPrincipal(user, oAuth2User.getAttributes());
    }
}
