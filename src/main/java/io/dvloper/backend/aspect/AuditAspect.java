package io.dvloper.backend.aspect;

import io.dvloper.backend.entities.Log;
import io.dvloper.backend.entities.Resource;
import io.dvloper.backend.repository.LogRepository;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.UUID;

@Aspect
@Component
public class AuditAspect {

    private final LogRepository logRepository;

    public AuditAspect(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    /**
     * Intercept all controller methods except those in LogController, and create
     * audit logs for POST, PUT, DELETE operations.
     */
    @AfterReturning(pointcut = "execution(* io.dvloper.backend.controller..*(..)) && " +
            "!execution(* io.dvloper.backend.controller.LogController.*(..))", returning = "result")
    public void auditControllerMethods(JoinPoint joinPoint, Object result) {
        try {
            // Check if the method is annotated with @PostMapping, @PutMapping, or
            // @DeleteMapping
            Method method = ((org.aspectj.lang.reflect.MethodSignature) joinPoint.getSignature()).getMethod();

            String actionType = null;
            if (method.isAnnotationPresent(PostMapping.class)) {
                actionType = "CREATE";
            } else if (method.isAnnotationPresent(PutMapping.class)) {
                actionType = "UPDATE";
            } else if (method.isAnnotationPresent(DeleteMapping.class)) {
                actionType = "DELETE";
            }

            // Exclude everything else (e.g., GET methods)
            if (actionType == null) {
                return;
            }

            // Extract user ID from JWT
            UUID userId = extractUserIdFromJwt();
            if (userId == null) {
                System.err.println("Cannot create audit log: user ID not found in JWT");
                return;
            }

            // Determine resource type based on controller class name
            String resourceType = determineResourceType(joinPoint);
            Resource affectedResource = extractResource(result);
            String comments = buildComment(actionType, resourceType, joinPoint);

            // Create and save the log entry
            Log log = new Log();
            log.setActionType(actionType);
            log.setActionDate(LocalDateTime.now());
            log.setCreatedByKeycloakId(userId);
            log.setResource(affectedResource);
            log.setComments(comments);
            log.setSuccess(true);

            logRepository.save(log);

        } catch (Exception e) {
            // Log the error but don't disrupt the main flow
            System.err.println("Failed to create audit log: " + e.getMessage());
        }
    }

    private UUID extractUserIdFromJwt() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
                Jwt jwt = (Jwt) authentication.getPrincipal();
                String sub = jwt.getSubject(); // Subject is the user ID in Keycloak
                return UUID.fromString(sub);
            }
        } catch (Exception e) {
            System.err.println("Failed to extract user ID from JWT: " + e.getMessage());
        }
        return null;
    }

    private String determineResourceType(JoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();

        // Remove "Controller" suffix and convert to lowercase
        if (className.endsWith("Controller")) {
            className = className.substring(0, className.length() - 10);
        }

        return className.toUpperCase();
    }

    private Resource extractResource(Object result) {
        if (result instanceof ResponseEntity) {
            ResponseEntity<?> responseEntity = (ResponseEntity<?>) result;
            Object body = responseEntity.getBody();

            if (body instanceof Resource) {
                return (Resource) body;
            }
        }

        return null;
    }

    private String buildComment(String actionType, String resourceType, JoinPoint joinPoint) {
        StringBuilder comment = new StringBuilder();
        comment.append(actionType).append(" operation on ").append(resourceType);

        // Add method name for more context
        String methodName = joinPoint.getSignature().getName();
        comment.append(" (").append(methodName).append(")");

        // Optionally, include the ID of the affected resource if available in method
        // arguments
        Object[] args = joinPoint.getArgs();
        if (args.length > 0 && args[0] instanceof UUID) {
            comment.append(" - ID: ").append(args[0]);
        }

        return comment.toString();
    }
}
