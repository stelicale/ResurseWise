package io.dvloper.backend.controller;

import io.dvloper.backend.dto.CreateKeycloakUserDTO;
import io.dvloper.backend.dto.KeycloakUserDTO;
import io.dvloper.backend.service.KeycloakUserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    public ResponseEntity<List<KeycloakUserDTO>> getAllUsers() {
        List<KeycloakUserDTO> users = keycloakUserService.getAllUsers();
        return ResponseEntity.ok(users);
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
}
