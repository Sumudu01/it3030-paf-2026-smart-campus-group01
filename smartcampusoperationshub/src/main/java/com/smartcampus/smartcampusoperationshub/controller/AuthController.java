package com.smartcampus.smartcampusoperationshub.controller;

import com.smartcampus.smartcampusoperationshub.model.User;
import com.smartcampus.smartcampusoperationshub.model.UserRole;
import com.smartcampus.smartcampusoperationshub.repository.UserRepository;
import com.smartcampus.smartcampusoperationshub.service.CustomOAuth2UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    @Autowired
    private UserRepository userRepository;

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

    // Admin endpoint to manage user roles
    @PostMapping("/admin/update-role")
    public String updateUserRole(@RequestParam String email, @RequestParam UserRole role) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setRole(role);
            userRepository.save(user);
        });
        return "redirect:/admin/users";
    }
}
