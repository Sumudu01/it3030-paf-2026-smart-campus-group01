# Manual Configuration for Booking System

## 1. Add Security Rules (SecurityConfig.java)
```
.requestMatchers("/api/bookings/**").authenticated()
.requestMatchers("/api/bookings/pending", "/api/bookings/admin").hasRole("ADMIN") 
.requestMatchers("/api/bookings/*/approve", "/api/bookings/*/reject").hasRole("ADMIN")
```

## 2. Permissions (Optional - CustomOAuth2UserService.java)
Add to ALL_PERMISSIONS:
```
"BOOKING_ADMIN", "RESOURCE_READ", "RESOURCE_WRITE"
```

## 3. Test
```
mvn clean compile
mvn spring-boot:run
```

