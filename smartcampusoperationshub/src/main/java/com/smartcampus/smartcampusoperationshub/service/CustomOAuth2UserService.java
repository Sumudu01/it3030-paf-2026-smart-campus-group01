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
import java.util.Arrays;
import java.util.List;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

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
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        
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
                hasAllPermissions = true;  // Admin gets all permissions
                permissions = ALL_PERMISSIONS;
            }
            
            user = new User(email, name, picture, defaultRole);
            user.setLastLoginAt(LocalDateTime.now());
            user.setRolePending(rolePending);
            user.setHasAllPermissions(hasAllPermissions);
            if (!permissions.isEmpty()) {
                user.setPermissions(permissions);
            }
            userRepository.save(user);
        } else {
            // Existing user - update last login
            user.setLastLoginAt(LocalDateTime.now());
            user.setName(name);
            user.setPicture(picture);
            
            // Grant admin role and all permissions if logging in with admin email
            if (ADMIN_EMAIL.equalsIgnoreCase(email)) {
                if (user.getRole() != UserRole.ADMIN) {
                    user.setRole(UserRole.ADMIN);
                }
                user.setRolePending(false);
                user.setHasAllPermissions(true);
                user.setPermissions(ALL_PERMISSIONS);
            }
            
            userRepository.save(user);
        }
        
        return new CustomOAuth2UserPrincipal(user, oAuth2User.getAttributes());
    }
}
