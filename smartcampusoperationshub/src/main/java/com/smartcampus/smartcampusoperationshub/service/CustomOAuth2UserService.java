package com.smartcampus.smartcampusoperationshub.service;

import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.model.UserRole;
import com.smartcampus.smartcampusoperationshub.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    @Autowired
    private UserRepository userRepository;
    
    // Admin email that gets automatic admin access and all permissions
    private static final String ADMIN_EMAIL = "sumuduwijeratne2002@gmail.com";
    
    // All available permissions in the system
    private static final List<String> ALL_PERMISSIONS = Arrays.asList(
        "USER_READ", "USER_WRITE", "USER_DELETE", "USER_ADMIN",
        "ROLE_READ", "ROLE_WRITE",
        "REPORT_READ", "REPORT_WRITE",
        "FACILITY_READ", "FACILITY_WRITE", "FACILITY_DELETE",
        "MAINTENANCE_READ", "MAINTENANCE_WRITE", "MAINTENANCE_DELETE",
        "ANNOUNCEMENT_READ", "ANNOUNCEMENT_WRITE", "ANNOUNCEMENT_DELETE",
        "EQUIPMENT_READ", "EQUIPMENT_WRITE", "EQUIPMENT_DELETE",
        "BOOKING_READ", "BOOKING_WRITE", "BOOKING_DELETE",
        "COMPLAINT_READ", "COMPLAINT_WRITE", "COMPLAINT_DELETE",
        "ADMIN_PANEL", "SETTINGS_READ", "SETTINGS_WRITE"
    );

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        logger.info("Loading OAuth2 user...");
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        
        logger.info("OAuth2 user attributes - email: {}, name: {}", email, name);
        
        if (email == null || email.isEmpty()) {
            logger.error("Email is null or empty! Cannot save user.");
            throw new OAuth2AuthenticationException("Email is required but not provided by OAuth2 provider");
        }
        
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            // New user - determine role based on email
            UserRole defaultRole = UserRole.STUDENT;
            boolean rolePending = true;
            boolean hasAllPermissions = false;
            List<String> permissions = java.util.Collections.emptyList();
            
            // Check if this is the admin email
            if (ADMIN_EMAIL.equalsIgnoreCase(email)) {
                defaultRole = UserRole.ADMIN;
                rolePending = false;
                hasAllPermissions = true;
                permissions = ALL_PERMISSIONS;
                logger.info("Setting admin role for admin email: {}", email);
            }
            
            user = new User(email, name, picture, defaultRole);
            user.setLastLoginAt(LocalDateTime.now());
            user.setRolePending(rolePending);
            user.setHasAllPermissions(hasAllPermissions);
            if (!permissions.isEmpty()) {
                user.setPermissions(permissions);
            }
            
            try {
                user = userRepository.save(user);
                logger.info("New user saved to database: {} with ID: {}", user.getEmail(), user.getId());
            } catch (Exception e) {
                logger.error("Error saving new user to database: {}", e.getMessage(), e);
                throw new OAuth2AuthenticationException("Failed to save user to database: " + e.getMessage());
            }
        } else {
            // Existing user - update last login
            user.setLastLoginAt(LocalDateTime.now());
            user.setName(name);
            user.setPicture(picture);
            
            // Grant admin role and all permissions if logging in with admin email
            if (ADMIN_EMAIL.equalsIgnoreCase(email)) {
                // FORCE set to ADMIN - fix any corrupted role in database
                user.setRole(UserRole.ADMIN);
                user.setRolePending(false);
                user.setHasAllPermissions(true);
                user.setPermissions(ALL_PERMISSIONS);
                logger.info("FORCE reset role to ADMIN for admin email: {}", email);
            }
            
            try {
                user = userRepository.save(user);
                logger.info("Existing user updated in database: {} with ID: {}", user.getEmail(), user.getId());
            } catch (Exception e) {
                logger.error("Error updating user in database: {}", e.getMessage(), e);
                throw new OAuth2AuthenticationException("Failed to update user in database: " + e.getMessage());
            }
        }
        
        return new CustomOAuth2UserPrincipal(user, oAuth2User.getAttributes());
    }
}
