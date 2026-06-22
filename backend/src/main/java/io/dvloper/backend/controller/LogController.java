package io.dvloper.backend.controller;

import io.dvloper.backend.dto.PagedResponse;
import io.dvloper.backend.entities.Log;
import io.dvloper.backend.repository.LogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Controller for viewing audit logs (Admin only)
 * Logs are created automatically via AuditAspect
 */
@RestController
@RequestMapping("/api/logs")
@Tag(name = "Log", description = "Audit log viewing")
public class LogController {
    private final LogRepository repository;

    public LogController(LogRepository repository) {
        this.repository = repository;
    }

    /**
     * Get logs from a specific time period
     * 
     * @param timeAgo Format: "5h" for 5 hours, "2d" for 2 days.
     *                Min: 1h, Max: 30d
     *                Examples: 1h, 6h, 1d, 7d, 30d
     */
    @GetMapping
    @Operation(summary = "Get audit logs", description = "Retrieve logs from a specific time period. Format: '5h' (5 hours) or '2d' (2 days). Min: 1h, Max: 30d")
    public ResponseEntity<PagedResponse<Log>> getLogs(
            @Parameter(description = "Time period (e.g., '1h', '6h', '1d', '7d', '30d'). Min: 1h, Max: 30d", example = "24h") @RequestParam(defaultValue = "24h") String timeAgo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "actionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String comments,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) Boolean success) {

        try {
            LocalDateTime fromDate = parseTimeAgo(timeAgo);

            int normalizedPage = Math.max(page, 0);
            int normalizedSize = Math.min(Math.max(size, 1), 100);
            String normalizedSortBy = normalizeLogSortBy(sortBy);
            Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by(direction, normalizedSortBy));

            Specification<Log> spec = Specification
                    .<Log>where((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("actionDate"), fromDate))
                    .and(logIdLike(id))
                    .and(containsIgnoreCase("actionType", actionType))
                    .and(containsIgnoreCase("comments", comments))
                    .and(userIdLike(userId))
                    .and(hasSuccess(success));

            Page<Log> result = repository.findAll(spec, pageable);
            PagedResponse<Log> response = new PagedResponse<>(
                    result.getContent(),
                    result.getNumber(),
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Parse time string like "5h" or "2d" into LocalDateTime
     * Validates: min 1h, max 30d
     */
    private LocalDateTime parseTimeAgo(String timeAgo) {
        if (timeAgo == null || timeAgo.length() < 2) {
            throw new IllegalArgumentException("Invalid time format. Use format like '5h' or '2d'");
        }

        String numberPart = timeAgo.substring(0, timeAgo.length() - 1);
        String unit = timeAgo.substring(timeAgo.length() - 1).toLowerCase();

        int value;
        try {
            value = Integer.parseInt(numberPart);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid number in time format. Use format like '5h' or '2d'");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fromDate;

        switch (unit) {
            case "h":
                if (value < 1) {
                    throw new IllegalArgumentException("Minimum time is 1 hour (1h)");
                }
                if (value > 720) { // 30 days * 24 hours
                    throw new IllegalArgumentException("Maximum time is 30 days (30d or 720h)");
                }
                fromDate = now.minusHours(value);
                break;
            case "d":
                if (value < 1) {
                    throw new IllegalArgumentException("Minimum time is 1 hour (1h)");
                }
                if (value > 30) {
                    throw new IllegalArgumentException("Maximum time is 30 days (30d)");
                }
                fromDate = now.minusDays(value);
                break;
            default:
                throw new IllegalArgumentException(
                        "Invalid time unit. Use 'h' for hours or 'd' for days (e.g., '5h' or '2d')");
        }

        return fromDate;
    }

    private Specification<Log> containsIgnoreCase(String field, String value) {
        return (root, query, cb) -> {
            if (value == null || value.isBlank()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get(field)), "%" + value.toLowerCase() + "%");
        };
    }

    private Specification<Log> userIdLike(String value) {
        return (root, query, cb) -> {
            if (value == null || value.isBlank()) {
                return cb.conjunction();
            }

            try {
                UUID parsed = UUID.fromString(value);
                return cb.equal(root.get("createdByKeycloakId"), parsed);
            } catch (IllegalArgumentException ignored) {
                return cb.like(cb.lower(root.get("createdByKeycloakId").as(String.class)),
                        "%" + value.toLowerCase() + "%");
            }
        };
    }

    private Specification<Log> logIdLike(String value) {
        return (root, query, cb) -> {
            if (value == null || value.isBlank()) {
                return cb.conjunction();
            }

            try {
                UUID parsed = UUID.fromString(value);
                return cb.equal(root.get("id"), parsed);
            } catch (IllegalArgumentException ignored) {
                return cb.like(cb.lower(root.get("id").as(String.class)), "%" + value.toLowerCase() + "%");
            }
        };
    }

    private Specification<Log> hasSuccess(Boolean value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get("success"), value);
    }

    private String normalizeLogSortBy(String sortBy) {
        return switch (sortBy) {
            case "id", "actionType", "actionDate", "comments", "createdByKeycloakId", "success" -> sortBy;
            default -> "actionDate";
        };
    }
}