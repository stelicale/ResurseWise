package io.dvloper.backend.controller;

import io.dvloper.backend.dto.CreateKeycloakUserDTO;
import io.dvloper.backend.dto.KeycloakUserDTO;
import io.dvloper.backend.dto.PagedResponse;
import io.dvloper.backend.service.KeycloakUserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User", description = "User management")
public class UserController {

    private final KeycloakUserService keycloakUserService;

    public UserController(KeycloakUserService keycloakUserService) {
        this.keycloakUserService = keycloakUserService;
    }

    /**
     * GET /api/users - Get all users from Keycloak
     */
    @GetMapping
    public ResponseEntity<PagedResponse<KeycloakUserDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "username") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String name) {

        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);

        Stream<KeycloakUserDTO> stream = keycloakUserService.getAllUsers().stream()
                .filter(u -> containsIgnoreCase(stringValue(u.getId()), id))
                .filter(u -> containsIgnoreCase(u.getUsername(), username))
                .filter(u -> containsIgnoreCase(u.getEmail(), email))
                .filter(u -> containsIgnoreCase(fullName(u), name));

        Comparator<KeycloakUserDTO> comparator = comparatorFor(sortBy);
        if ("desc".equalsIgnoreCase(sortDir)) {
            comparator = comparator.reversed();
        }

        List<KeycloakUserDTO> filteredSorted = stream.sorted(comparator).toList();
        long totalElements = filteredSorted.size();
        int from = normalizedPage * normalizedSize;
        int to = Math.min(from + normalizedSize, filteredSorted.size());

        List<KeycloakUserDTO> content = from >= filteredSorted.size()
                ? List.of()
                : filteredSorted.subList(from, to);

        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / normalizedSize);
        PagedResponse<KeycloakUserDTO> response = new PagedResponse<>(content, normalizedPage, normalizedSize,
                totalElements,
                totalPages);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/users/{id} - Get user by ID from Keycloak
     */
    @GetMapping("/{id}")
    public ResponseEntity<KeycloakUserDTO> getUserById(@PathVariable UUID id) {
        return keycloakUserService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/users/roles/available - Get all available realm roles
     */
    @GetMapping("/roles/available")
    public ResponseEntity<List<Map<String, Object>>> getAvailableRoles() {
        List<Map<String, Object>> roles = keycloakUserService.getAvailableRoles();
        return ResponseEntity.ok(roles);
    }

    /**
     * POST /api/users - Create new user in Keycloak
     */
    @PostMapping
    public ResponseEntity<KeycloakUserDTO> createUser(@Valid @RequestBody CreateKeycloakUserDTO createUserDTO) {
        KeycloakUserDTO createdUser = keycloakUserService.createUser(createUserDTO);

        if (createdUser != null) {
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }

    /**
     * PUT /api/users/{id} - Update user in Keycloak
     */
    @PutMapping("/{id}")
    public ResponseEntity<KeycloakUserDTO> updateUser(@PathVariable UUID id,
            @Valid @RequestBody KeycloakUserDTO userDTO) {
        KeycloakUserDTO updatedUser = keycloakUserService.updateUser(id, userDTO);

        if (updatedUser != null) {
            return ResponseEntity.ok(updatedUser);
        }

        return ResponseEntity.notFound().build();
    }

    /**
     * DELETE /api/users/{id} - Delete user from Keycloak
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        keycloakUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    private Comparator<KeycloakUserDTO> comparatorFor(String sortBy) {
        return switch (sortBy) {
            case "id" -> Comparator.comparing(u -> stringValue(u.getId()), String.CASE_INSENSITIVE_ORDER);
            case "email" -> Comparator.comparing(u -> stringValue(u.getEmail()), String.CASE_INSENSITIVE_ORDER);
            case "name", "fullName" -> Comparator.comparing(this::fullName, String.CASE_INSENSITIVE_ORDER);
            case "username" -> Comparator.comparing(u -> stringValue(u.getUsername()), String.CASE_INSENSITIVE_ORDER);
            default -> Comparator.comparing(u -> stringValue(u.getUsername()), String.CASE_INSENSITIVE_ORDER);
        };
    }

    private String fullName(KeycloakUserDTO user) {
        String first = stringValue(user.getFirstName());
        String last = stringValue(user.getLastName());
        return (first + " " + last).trim();
    }

    private boolean containsIgnoreCase(String source, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }
        return stringValue(source).toLowerCase().contains(filter.toLowerCase());
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
