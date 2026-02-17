package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Log;
import io.dvloper.backend.repository.LogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

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
    public ResponseEntity<List<Log>> getLogs(
            @Parameter(description = "Time period (e.g., '1h', '6h', '1d', '7d', '30d'). Min: 1h, Max: 30d", example = "24h") @RequestParam(defaultValue = "24h") String timeAgo) {

        try {
            LocalDateTime fromDate = parseTimeAgo(timeAgo);
            List<Log> logs = repository.findLogsSince(fromDate);
            return ResponseEntity.ok(logs);
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
}