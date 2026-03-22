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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
public class AuthController {

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
            model.addAttribute("name", principal.getAttribute("name"));
            model.addAttribute("email", principal.getAttribute("email"));
            model.addAttribute("picture", principal.getAttribute("picture"));
            
            // Get user role from authorities
            for (GrantedAuthority authority : principal.getAuthorities()) {
                String role = authority.getAuthority().replace("ROLE_", "");
                model.addAttribute("role", role);
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomOAuth2UserPrincipal) {
            CustomOAuth2UserPrincipal principal = (CustomOAuth2UserPrincipal) auth.getPrincipal();
            User user = principal.getUser();
            
            model.addAttribute("email", user.getEmail());
            model.addAttribute("name", user.getName());
            model.addAttribute("role", user.getRole());
            model.addAttribute("lastLogin", user.getLastLoginAt());
            model.addAttribute("createdAt", user.getCreatedAt());
            model.addAttribute("sessionId", auth.getDetails());
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomOAuth2UserPrincipal) {
            CustomOAuth2UserPrincipal principal = (CustomOAuth2UserPrincipal) auth.getPrincipal();
            User user = principal.getUser();
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("name", user.getName());
            userData.put("picture", user.getPicture());
            userData.put("role", user.getRole());
            userData.put("createdAt", user.getCreatedAt());
            userData.put("lastLoginAt", user.getLastLoginAt());
            userData.put("enabled", user.isEnabled());
            userData.put("rolePending", user.isRolePending());
            
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomOAuth2UserPrincipal) {
            CustomOAuth2UserPrincipal principal = (CustomOAuth2UserPrincipal) auth.getPrincipal();
            User user = principal.getUser();
            
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
            userRepository.save(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Role selected successfully");
            response.put("role", user.getRole());
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
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomOAuth2UserPrincipal) {
            CustomOAuth2UserPrincipal principal = (CustomOAuth2UserPrincipal) auth.getPrincipal();
            User user = principal.getUser();
            
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
                    response.put("newRole", user.getRole());
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
        
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(user -> {
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("id", user.getId());
                    userData.put("email", user.getEmail());
                    userData.put("name", user.getName());
                    userData.put("role", user.getRole());
                    userData.put("createdAt", user.getCreatedAt());
                    userData.put("lastLoginAt", user.getLastLoginAt());
                    userData.put("enabled", user.isEnabled());
                    return userData;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(users);
    }
}
