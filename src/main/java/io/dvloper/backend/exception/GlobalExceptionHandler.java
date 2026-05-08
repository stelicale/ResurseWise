package io.dvloper.backend.exception;

import io.dvloper.backend.entities.Log;
import io.dvloper.backend.repository.LogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private LogRepository logRepository;

    // (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(DuplicateEntryException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateEntry(DuplicateEntryException ex,
            HttpServletRequest request) {
        writeFailureAudit(request, ex.getMessage());

        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex,
            HttpServletRequest request) {
        String message = "Duplicate entry is not allowed";
        writeFailureAudit(request, message + ": " + rootCauseMessage(ex));

        Map<String, String> error = new HashMap<>();
        error.put("message", message);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    // Unexpected exceptions
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralErrors(Exception ex) {
        ex.printStackTrace(); // Log the stack trace for debugging
        Map<String, String> error = new HashMap<>();
        error.put("error", "An unexpected error occurred");
        error.put("details", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private void writeFailureAudit(HttpServletRequest request, String details) {
        if (logRepository == null) {
            return;
        }

        try {
            Log failedLog = new Log();
            failedLog.setActionType(resolveActionType(request));
            failedLog.setActionDate(LocalDateTime.now());
            failedLog.setCreatedByKeycloakId(extractUserIdFromJwt());
            failedLog.setResource(null);
            failedLog.setSuccess(false);
            failedLog.setComments(buildFailureComment(request, details));
            logRepository.save(failedLog);
        } catch (Exception ignored) {
            // Do not break the response path if logging fails.
        }
    }

    private String resolveActionType(HttpServletRequest request) {
        if (request == null) {
            return "ERROR";
        }

        return switch (request.getMethod()) {
            case "POST" -> "CREATE";
            case "PUT", "PATCH" -> "UPDATE";
            case "DELETE" -> "DELETE";
            default -> "ERROR";
        };
    }

    private String buildFailureComment(HttpServletRequest request, String details) {
        if (request == null) {
            return details;
        }

        return String.format("%s %s failed: %s", request.getMethod(), request.getRequestURI(), details);
    }

    private UUID extractUserIdFromJwt() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            try {
                return UUID.fromString(jwt.getSubject());
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }

        return null;
    }

    private String rootCauseMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current.getMessage() != null ? current.getMessage() : throwable.getMessage();
    }
}