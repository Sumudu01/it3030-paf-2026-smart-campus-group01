package com.smartcampus.smartcampusoperationshub.controller;

import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.model.UserRole;
import com.smartcampus.smartcampusoperationshub.repository.UserRepository;
import com.smartcampus.smartcampusoperationshub.service.CustomOAuth2UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class AuthController {
    private static final String REACT_HOME_URL = "http://localhost:5173/home";

    @Autowired
    private UserRepository userRepository;

    // ==================== Thymeleaf Views ====================
    
    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/home")
    public String home(Model model, @AuthenticationPrincipal OAuth2User principal) {
        if (principal != null) {
            boolean isAdmin = principal.getAuthorities().stream()
                    .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));

            if (isAdmin) {
                // Admin UI is implemented in React frontend
                return "redirect:" + REACT_HOME_URL;
            }

            model.addAttribute("name", principal.getAttribute("name"));
            model.addAttribute("email", principal.getAttribute("email"));
            model.addAttribute("picture", principal.getAttribute("picture"));
            
            // Get user role from authorities - find the one with ROLE_ prefix only
            for (GrantedAuthority authority : principal.getAuthorities()) {
                String authStr = authority.getAuthority();
                if (authStr.startsWith("ROLE_")) {
                    String role = authStr.replace("ROLE_", "");
                    model.addAttribute("role", role);
                    break; // Only use the first role authority found
                }
            }
        }
        return "home";
    }

    @GetMapping("/")
    public String index() {
        return "redirect:/home";
    }

    @GetMapping("/session-info")
    public String sessionInfo(Model model) {
        User user = getAuthenticatedUser();
        if (user != null) {
            model.addAttribute("email", user.getEmail());
            model.addAttribute("name", user.getName());
            model.addAttribute("role", user.getRole());
            model.addAttribute("lastLogin", user.getLastLoginAt());
            model.addAttribute("createdAt", user.getCreatedAt());
            model.addAttribute("sessionId", SecurityContextHolder.getContext().getAuthentication().getDetails());
        }
        return "session-info";
    }

    // ==================== REST API Endpoints ====================
    // Requirement: At least 4 REST endpoints (GET, POST, PUT, DELETE)

    /**
     * GET - Get current authenticated user
     * Returns user details as JSON
     */
    @GetMapping("/api/auth/user")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        User user = getAuthenticatedUser();
        if (user != null) {
            // DEBUG: Log the exact role
            System.out.println("DEBUG getCurrentUser - user.getRole(): " + user.getRole());
            System.out.println("DEBUG getCurrentUser - user.getRole().name(): " + (user.getRole() != null ? user.getRole().name() : "null"));
            System.out.println("DEBUG getCurrentUser - user email: " + user.getEmail());

            // Ensure role is valid
            if (user.getRole() == null) {
                user.setRole(UserRole.STUDENT);
                userRepository.save(user);
            }

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("name", user.getName());
            userData.put("picture", user.getPicture());

            String roleStr = user.getRole().name();
            
            userData.put("roleName", roleStr);
            userData.put("role", roleStr);
            System.out.println("DEBUG getCurrentUser - returning JSON: " + userData);
            
            userData.put("createdAt", user.getCreatedAt());
            userData.put("lastLoginAt", user.getLastLoginAt());
            userData.put("enabled", user.isEnabled());
            userData.put("rolePending", user.isRolePending());
            userData.put("hasAllPermissions", user.isHasAllPermissions());
            
            // Only include permissions for admin users to reduce confusion
            if (user.isHasAllPermissions() || user.getRole() == UserRole.ADMIN) {
                userData.put("permissions", user.getPermissions());
            } else {
                userData.put("permissions", java.util.Collections.emptyList());
            }
            
            return ResponseEntity.ok(userData);
        }
        return ResponseEntity.status(401).build();
    }

    /**
     * POST - Select user role after OAuth login
     * Allows new users to select their role (STUDENT, STAFFMEMBER, or TECHNICIAN)
     * ADMIN role cannot be self-selected
     */
    @PostMapping("/api/auth/select-role")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> selectRole(@RequestParam UserRole role) {
        User user = getAuthenticatedUser();
        if (user != null) {
            // Only allow role selection if role is pending
            if (!user.isRolePending()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Role has already been selected");
                return ResponseEntity.status(400).body(error);
            }
            
            // Don't allow selecting ADMIN role (must be assigned by existing admin)
            if (role == UserRole.ADMIN) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Cannot select ADMIN role. Contact system administrator.");
                return ResponseEntity.status(400).body(error);
            }
            
            // Update user role
            user.setRole(role);
            user.setRolePending(false);
            user = userRepository.save(user);
            
            // Update the authentication principal with new role for immediate effect
            CustomOAuth2UserPrincipal updatedPrincipal = new CustomOAuth2UserPrincipal(
                user, 
                SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof CustomOAuth2UserPrincipal 
                    ? ((CustomOAuth2UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getAttributes()
                    : java.util.Collections.emptyMap()
            );
            
            var authentication = org.springframework.security.authentication.UsernamePasswordAuthenticationToken
                .authenticated(updatedPrincipal, null, updatedPrincipal.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Role selected successfully");
            response.put("role", user.getRole().name());
            response.put("roleName", user.getRole().name());
            response.put("rolePending", user.isRolePending());
            
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(401).build();
    }

    /**
     * POST - Create new user profile or update preferences
     * Used for profile creation/update after OAuth login
     */
    @PostMapping("/api/auth/profile")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createOrUpdateProfile(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String picture) {

        User user = getAuthenticatedUser();
        if (user != null) {
            // Update user profile
            if (name != null) user.setName(name);
            if (picture != null) user.setPicture(picture);
            userRepository.save(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile updated successfully");
            response.put("email", user.getEmail());
            response.put("name", user.getName());
            
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(401).build();
    }

    private User getAuthenticatedUser() {
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
            if (email == null || email.isBlank()) {
                return null;
            }
            return userRepository.findByEmail(email).orElse(null);
        }

        return null;
    }

    /**
     * PUT - Update user role (Admin only)
     * Updates a user's role in the system
     */
    @PutMapping("/api/auth/user/{email}/role")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @PathVariable String email,
            @RequestParam UserRole role) {
        
        // Check if current user is admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Unauthorized. Admin role required.");
            return ResponseEntity.status(403).body(error);
        }
        
        return userRepository.findByEmail(email)
                .map(user -> {
                    user.setRole(role);
                    userRepository.save(user);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "User role updated successfully");
                    response.put("email", user.getEmail());
                    response.put("newRole", user.getRole().name());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> error = new HashMap<>();
                    error.put("error", "User not found");
                    return ResponseEntity.status(404).body(error);
                });
    }

    /**
     * DELETE - Delete user account (Admin only)
     * Removes user from the system
     */
    @DeleteMapping("/api/auth/user/{email}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable String email) {
        
        // Check if current user is admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Unauthorized. Admin role required.");
            return ResponseEntity.status(403).body(error);
        }
        
        return userRepository.findByEmail(email)
                .map(user -> {
                    userRepository.delete(user);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "User deleted successfully");
                    response.put("deletedEmail", email);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> error = new HashMap<>();
                    error.put("error", "User not found");
                    return ResponseEntity.status(404).body(error);
                });
    }

    /**
     * GET - List all users (Admin only)
     * Returns all users in the system
     */
    @GetMapping("/api/auth/users")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        // Check if current user is admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin) {
            return ResponseEntity.status(403).build();
        }
        
        // UserRepository.findAll() is configured with EntityGraph to load permissions
        // from user_permissions table together with users.
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(user -> {
                    // Ensure role is valid
                    if (user.getRole() == null) {
                        user.setRole(UserRole.STUDENT);
                        userRepository.save(user);
                    }

                    Map<String, Object> userData = new HashMap<>();
                    userData.put("id", user.getId());
                    userData.put("email", user.getEmail());
                    userData.put("name", user.getName());
                    userData.put("role", user.getRole().name());
                    userData.put("createdAt", user.getCreatedAt());
                    userData.put("lastLoginAt", user.getLastLoginAt());
                    userData.put("enabled", user.isEnabled());
                    userData.put("hasAllPermissions", user.isHasAllPermissions());
                    userData.put("permissions", user.getPermissions() != null ? user.getPermissions() : Collections.emptyList());
                    return userData;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(users);
    }
    
    /**
     * PUT - Grant permissions to user (Admin only)
     * Grants specific permissions to a user
     */
    @PutMapping("/api/auth/user/{email}/permissions")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> grantPermissions(
            @PathVariable String email,
            @RequestBody Map<String, List<String>> request) {

        List<String> permissions = request.get("permissions");
        
        // Check if current user is admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Unauthorized. Admin role required.");
            return ResponseEntity.status(403).body(error);
        }
        
        return userRepository.findByEmail(email)
                .map(user -> {
                    // Grant permissions
                    for (String permission : permissions) {
                        user.addPermission(permission);
                    }
                    userRepository.save(user);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Permissions granted successfully");
                    response.put("email", user.getEmail());
                    response.put("permissions", user.getPermissions());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> error = new HashMap<>();
                    error.put("error", "User not found");
                    return ResponseEntity.status(404).body(error);
                });
    }
    
    /**
     * DELETE - Revoke permissions from user (Admin only)
     * Revokes specific permissions from a user
     */
    @DeleteMapping("/api/auth/user/{email}/permissions")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> revokePermissions(
            @PathVariable String email,
            @RequestBody Map<String, List<String>> request) {

        List<String> permissions = request.get("permissions");
        
        // Check if current user is admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Unauthorized. Admin role required.");
            return ResponseEntity.status(403).body(error);
        }
        
        return userRepository.findByEmail(email)
                .map(user -> {
                    // Revoke permissions
                    for (String permission : permissions) {
                        user.removePermission(permission);
                    }
                    userRepository.save(user);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Permissions revoked successfully");
                    response.put("email", user.getEmail());
                    response.put("permissions", user.getPermissions());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> error = new HashMap<>();
                    error.put("error", "User not found");
                    return ResponseEntity.status(404).body(error);
                });
    }
    
    /**
     * PUT - Grant all permissions to user (Admin only)
     * Makes a user a super admin with all permissions
     */
    @PutMapping("/api/auth/user/{email}/grant-all-permissions")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> grantAllPermissions(@PathVariable String email) {
        
        // Check if current user is admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Unauthorized. Admin role required.");
            return ResponseEntity.status(403).body(error);
        }
        
        return userRepository.findByEmail(email)
                .map(user -> {
                    user.setHasAllPermissions(true);
                    userRepository.save(user);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "All permissions granted successfully");
                    response.put("email", user.getEmail());
                    response.put("hasAllPermissions", user.isHasAllPermissions());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> error = new HashMap<>();
                    error.put("error", "User not found");
                    return ResponseEntity.status(404).body(error);
                });
    }
    
    /**
     * GET - Get all available permissions
     * Returns list of all permissions that can be granted
     */
    @GetMapping("/api/auth/permissions")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getAllAvailablePermissions() {
        // Check if current user is admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin) {
            return ResponseEntity.status(403).build();
        }
        
        List<String> allPermissions = Arrays.asList(
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
        
        Map<String, Object> response = new HashMap<>();
        response.put("permissions", allPermissions);
        return ResponseEntity.ok(response);
    }
    
    /**
     * PUT - Enable/disable user (Admin only)
     */
    @PutMapping("/api/auth/user/{email}/enable")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> setUserEnabled(
            @PathVariable String email,
            @RequestParam boolean enabled) {
        
        // Check if current user is admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Unauthorized. Admin role required.");
            return ResponseEntity.status(403).body(error);
        }
        
        return userRepository.findByEmail(email)
                .map(user -> {
                    user.setEnabled(enabled);
                    userRepository.save(user);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "User " + (enabled ? "enabled" : "disabled") + " successfully");
                    response.put("email", user.getEmail());
                    response.put("enabled", user.isEnabled());
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> error = new HashMap<>();
                    error.put("error", "User not found");
                    return ResponseEntity.status(404).body(error);
                });
    }
    
    /**
     * DEBUG endpoint - Check database state without authentication
     * Use this to diagnose user saving issues
     */
    @GetMapping("/api/debug/db-status")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> debugDbStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Check if table exists
            long tableCount = userRepository.count();
            response.put("userCount", tableCount);
            response.put("status", "connected");
            response.put("message", "Database is accessible, found " + tableCount + " users");
            
            // Get list of users (without sensitive info)
            List<Map<String, Object>> users = userRepository.findAll().stream()
                    .map(user -> {
                        Map<String, Object> userData = new HashMap<>();
                        userData.put("id", user.getId());
                        userData.put("email", user.getEmail());
                        userData.put("name", user.getName());
                        userData.put("role", user.getRole());
                        return userData;
                    })
                    .collect(Collectors.toList());
            response.put("users", users);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
