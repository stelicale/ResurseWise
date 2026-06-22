package io.dvloper.backend.config;

import io.dvloper.backend.entities.Log;
import io.dvloper.backend.repository.LogRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class AuditAccessDeniedHandler implements AccessDeniedHandler {

    private final LogRepository logRepository;

    public AuditAccessDeniedHandler(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException accessDeniedException) {
        try {
            UUID userId = extractUserIdFromJwt();
            if (userId != null) {
                Log deniedLog = new Log();
                deniedLog.setActionType("ACCESS_DENIED");
                deniedLog.setActionDate(LocalDateTime.now());
                deniedLog.setCreatedByKeycloakId(userId);
                deniedLog.setResource(null);
                deniedLog.setSuccess(false);
                deniedLog.setComments(buildDeniedComment(request));
                logRepository.save(deniedLog);
            }
        } catch (Exception ignored) {
            // Avoid breaking the security response flow if audit logging fails.
        }

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        try {
            response.getWriter().write("{\"message\":\"Access denied\"}");
        } catch (Exception ignored) {
            // No-op: response is already forbidden.
        }
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

    private String buildDeniedComment(HttpServletRequest request) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        return String.format("Access denied for %s %s (missing required Admin role)", method, uri);
    }
}
