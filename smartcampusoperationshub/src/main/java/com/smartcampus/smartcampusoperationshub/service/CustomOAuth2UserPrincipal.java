package com.smartcampus.smartcampusoperationshub.service;

import com.smartcampus.smartcampusoperationshub.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class CustomOAuth2UserPrincipal implements OAuth2User {
    
    private final User user;
    private final Map<String, Object> attributes;

    public CustomOAuth2UserPrincipal(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        
        // Add role as authority with ROLE_ prefix
        String roleAuth = "ROLE_" + user.getRole().name();
        authorities.add(new SimpleGrantedAuthority(roleAuth));
        System.out.println("DEBUG CustomOAuth2UserPrincipal.getAuthorities() - role: " + roleAuth + ", user.getRole(): " + user.getRole());
        
        // Add all permissions as authorities
        if (user.isHasAllPermissions()) {
            // Grant all permissions to admin superuser
            List<String> allPermissions = List.of(
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
            authorities.addAll(allPermissions.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList()));
        } else if (user.getPermissions() != null) {
            // Grant specific permissions
            authorities.addAll(user.getPermissions().stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList()));
        }
        
        return authorities;
    }

    @Override
    public String getName() {
        return user.getName();
    }

    public User getUser() {
        return user;
    }

    public String getEmail() {
        return user.getEmail();
    }
}
