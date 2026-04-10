package com.smartcampus.smartcampusoperationshub.api;

import com.smartcampus.smartcampusoperationshub.security.UnauthorizedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ApiExceptions.BadRequestException.class)
    public ResponseEntity<Map<String, Object>> badRequest(ApiExceptions.BadRequestException ex) {
        return json(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(ApiExceptions.NotFoundException.class)
    public ResponseEntity<Map<String, Object>> notFound(ApiExceptions.NotFoundException ex) {
        return json(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ApiExceptions.ConflictException.class)
    public ResponseEntity<Map<String, Object>> conflict(ApiExceptions.ConflictException ex) {
        return json(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ApiExceptions.ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> forbidden(ApiExceptions.ForbiddenException ex) {
        return json(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> unauthorized(UnauthorizedException ex) {
        return json(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> json(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}

