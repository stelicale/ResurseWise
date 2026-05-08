package io.dvloper.backend.service;

import io.dvloper.backend.dto.CreateKeycloakUserDTO;
import io.dvloper.backend.dto.KeycloakUserDTO;
import io.dvloper.backend.exception.DuplicateEntryException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class KeycloakUserService {

    @Value("${keycloak.admin.url:http://localhost:8081}")
    private String keycloakAdminUrl;

    @Value("${keycloak.realm:ITResurceManager}")
    private String realm;

    @Value("${keycloak.admin.client-id:admin-cli}")
    private String clientId;

    @Value("${keycloak.admin.username:admin}")
    private String adminUsername;

    @Value("${keycloak.admin.password:admin}")
    private String adminPassword;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings({ "unchecked", "rawtypes" })
    private List<KeycloakUserDTO> getAllUsers(String bearerToken) {
        String url = String.format("%s/admin/realms/%s/users", keycloakAdminUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearerToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            List<Map<String, Object>> users = response.getBody();

            if (users == null) {
                return new ArrayList<>();
            }

            return users.stream()
                    .map(this::mapToUserDTO)
                    .collect(Collectors.toList());
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            System.err.println("Keycloak error: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            throw new RuntimeException("Failed to get users: " + e.getStatusCode(), e);
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            throw new RuntimeException("Failed to get users: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings({ "unchecked", "rawtypes" })
    private Optional<KeycloakUserDTO> getUserById(String bearerToken, UUID id) {
        String url = String.format("%s/admin/realms/%s/users/%s", keycloakAdminUrl, realm, id.toString());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearerToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> user = response.getBody();

            if (user == null) {
                return Optional.empty();
            }

            return Optional.of(mapToUserDTO(user));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private KeycloakUserDTO createUser(String bearerToken, CreateKeycloakUserDTO createUserDTO) {
        String url = String.format("%s/admin/realms/%s/users", keycloakAdminUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearerToken);
        headers.add("Content-Type", "application/json");

        Map<String, Object> userRepresentation = new HashMap<>();
        userRepresentation.put("username", createUserDTO.getUsername());
        userRepresentation.put("email", createUserDTO.getEmail());
        userRepresentation.put("firstName", createUserDTO.getFirstName());
        userRepresentation.put("lastName", createUserDTO.getLastName());
        userRepresentation.put("enabled", createUserDTO.getEnabled());

        // Add credentials
        Map<String, Object> credential = new HashMap<>();
        credential.put("type", "password");
        credential.put("value", createUserDTO.getPassword());
        credential.put("temporary", false);
        userRepresentation.put("credentials", Collections.singletonList(credential));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(userRepresentation, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            // Keycloak returns 201 Created with Location header containing user ID
            String location = response.getHeaders().getLocation() != null
                    ? response.getHeaders().getLocation().toString()
                    : null;

            if (location != null) {
                String userId = location.substring(location.lastIndexOf('/') + 1);
                UUID userUuid = UUID.fromString(userId);

                // Assign roles if provided
                if (createUserDTO.getRoles() != null && !createUserDTO.getRoles().isEmpty()) {
                    assignRolesToUser(bearerToken, userUuid, createUserDTO.getRoles());
                }

                return getUserById(bearerToken, userUuid).orElse(null);
            }

            return null;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            if (isDuplicateUserError(e)) {
                throw new DuplicateEntryException("User already exists with the same username or email");
            }
            System.err.println("Keycloak error response: " + e.getResponseBodyAsString());
            throw new RuntimeException(
                    "Failed to create user: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            throw new RuntimeException("Failed to create user: " + e.getMessage(), e);
        }
    }

    private KeycloakUserDTO updateUser(String bearerToken, UUID id, KeycloakUserDTO userDTO) {
        // First, get the existing user from Keycloak
        Optional<KeycloakUserDTO> existingUserOpt = getUserById(bearerToken, id);

        if (existingUserOpt.isEmpty()) {
            return null; // User not found
        }

        KeycloakUserDTO existingUser = existingUserOpt.get();

        String url = String.format("%s/admin/realms/%s/users/%s", keycloakAdminUrl, realm, id.toString());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearerToken);
        headers.add("Content-Type", "application/json");

        // Build user representation with existing data as fallback
        Map<String, Object> userRepresentation = new HashMap<>();
        userRepresentation.put("username", existingUser.getUsername()); // Username cannot be changed
        userRepresentation.put("email", userDTO.getEmail() != null ? userDTO.getEmail() : existingUser.getEmail());
        userRepresentation.put("firstName",
                userDTO.getFirstName() != null ? userDTO.getFirstName() : existingUser.getFirstName());
        userRepresentation.put("lastName",
                userDTO.getLastName() != null ? userDTO.getLastName() : existingUser.getLastName());
        userRepresentation.put("enabled",
                userDTO.getEnabled() != null ? userDTO.getEnabled() : existingUser.getEnabled());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(userRepresentation, headers);

        try {
            restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);

            // Update roles if provided
            if (userDTO.getRoles() != null) {
                updateUserRoles(bearerToken, id, userDTO.getRoles());
            }

            return getUserById(bearerToken, id).orElse(null);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            if (isDuplicateUserError(e)) {
                throw new DuplicateEntryException("User already exists with the same username or email");
            }
            throw new RuntimeException(
                    "Failed to update user: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update user: " + e.getMessage(), e);
        }
    }

    private void deleteUser(String bearerToken, UUID id) {
        String url = String.format("%s/admin/realms/%s/users/%s", keycloakAdminUrl, realm, id.toString());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearerToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete user: " + e.getMessage(), e);
        }
    }

    // Fallback method using admin credentials (for backward compatibility or system
    // operations)
    public List<KeycloakUserDTO> getAllUsers() {
        String token = getAdminToken();
        return getAllUsers(token);
    }

    public Optional<KeycloakUserDTO> getUserById(UUID id) {
        String token = getAdminToken();
        return getUserById(token, id);
    }

    public KeycloakUserDTO createUser(CreateKeycloakUserDTO createUserDTO) {
        String token = getAdminToken();
        return createUser(token, createUserDTO);
    }

    public KeycloakUserDTO updateUser(UUID id, KeycloakUserDTO userDTO) {
        String token = getAdminToken();
        return updateUser(token, id, userDTO);
    }

    public void deleteUser(UUID id) {
        String token = getAdminToken();
        deleteUser(token, id);
    }

    private KeycloakUserDTO mapToUserDTO(Map<String, Object> keycloakUser) {
        String id = (String) keycloakUser.get("id");
        String email = (String) keycloakUser.get("email");
        String username = (String) keycloakUser.get("username");
        String firstName = (String) keycloakUser.get("firstName");
        String lastName = (String) keycloakUser.get("lastName");
        Boolean enabled = (Boolean) keycloakUser.get("enabled");

        KeycloakUserDTO dto = new KeycloakUserDTO(UUID.fromString(id), email, username, firstName, lastName);
        dto.setEnabled(enabled);

        // Get user roles
        try {
            String token = getAdminToken();
            List<String> roles = getUserRoles(token, UUID.fromString(id));
            dto.setRoles(roles);
        } catch (Exception e) {
            System.err.println("Failed to get roles for user " + id + ": " + e.getMessage());
            dto.setRoles(new ArrayList<>());
        }

        return dto;
    }

    /**
     * Get realm roles assigned to a user
     */
    @SuppressWarnings({ "unchecked", "rawtypes" })
    private List<String> getUserRoles(String bearerToken, UUID userId) {
        String url = String.format("%s/admin/realms/%s/users/%s/role-mappings/realm",
                keycloakAdminUrl, realm, userId.toString());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearerToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            List<Map<String, Object>> roles = response.getBody();

            if (roles == null) {
                return new ArrayList<>();
            }

            return roles.stream()
                    .map(role -> (String) role.get("name"))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Failed to get user roles: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Get all available realm roles
     */
    @SuppressWarnings({ "unchecked", "rawtypes" })
    private List<Map<String, Object>> getAvailableRoles(String bearerToken) {
        String url = String.format("%s/admin/realms/%s/roles", keycloakAdminUrl, realm);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearerToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            return response.getBody() != null ? response.getBody() : new ArrayList<>();
        } catch (Exception e) {
            throw new RuntimeException("Failed to get available roles: " + e.getMessage(), e);
        }
    }

    public List<Map<String, Object>> getAvailableRoles() {
        String token = getAdminToken();
        return getAvailableRoles(token);
    }

    /**
     * Assign realm roles to a user
     */
    private void assignRolesToUser(String bearerToken, UUID userId, List<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            return;
        }

        // First, get all available roles to find the role objects by name
        List<Map<String, Object>> availableRoles = getAvailableRoles(bearerToken);

        List<Map<String, Object>> rolesToAssign = availableRoles.stream()
                .filter(role -> roleNames.contains(role.get("name")))
                .collect(Collectors.toList());

        if (rolesToAssign.isEmpty()) {
            System.err.println("No valid roles found to assign");
            return;
        }

        String url = String.format("%s/admin/realms/%s/users/%s/role-mappings/realm",
                keycloakAdminUrl, realm, userId.toString());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearerToken);
        headers.add("Content-Type", "application/json");

        HttpEntity<List<Map<String, Object>>> entity = new HttpEntity<>(rolesToAssign, headers);

        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to assign roles to user: " + e.getMessage(), e);
        }
    }

    /**
     * Remove all realm roles from a user and assign new ones
     */
    private void updateUserRoles(String bearerToken, UUID userId, List<String> newRoleNames) {
        // Get current roles
        List<String> currentRoles = getUserRoles(bearerToken, userId);

        if (!currentRoles.isEmpty()) {
            // Remove current roles
            List<Map<String, Object>> availableRoles = getAvailableRoles(bearerToken);
            List<Map<String, Object>> rolesToRemove = availableRoles.stream()
                    .filter(role -> currentRoles.contains(role.get("name")))
                    .collect(Collectors.toList());

            if (!rolesToRemove.isEmpty()) {
                String url = String.format("%s/admin/realms/%s/users/%s/role-mappings/realm",
                        keycloakAdminUrl, realm, userId.toString());

                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(bearerToken);
                headers.add("Content-Type", "application/json");

                HttpEntity<List<Map<String, Object>>> entity = new HttpEntity<>(rolesToRemove, headers);

                try {
                    restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);
                } catch (Exception e) {
                    System.err.println("Failed to remove roles: " + e.getMessage());
                }
            }
        }

        // Assign new roles
        if (newRoleNames != null && !newRoleNames.isEmpty()) {
            assignRolesToUser(bearerToken, userId, newRoleNames);
        }
    }

    @SuppressWarnings({ "unchecked", "rawtypes" })

    private String getAdminToken() {
        String url = String.format("%s/realms/master/protocol/openid-connect/token", keycloakAdminUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", clientId);
        body.add("username", adminUsername);
        body.add("password", adminPassword);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("access_token")) {
                return (String) responseBody.get("access_token");
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            throw new RuntimeException(
                    "Failed to obtain Keycloak admin token: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(),
                    e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to obtain Keycloak admin token", e);
        }

        throw new RuntimeException("Failed to obtain Keycloak admin token");
    }

    private boolean isDuplicateUserError(org.springframework.web.client.HttpClientErrorException e) {
        if (e.getStatusCode() == HttpStatus.CONFLICT) {
            return true;
        }

        if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
            String body = Optional.ofNullable(e.getResponseBodyAsString()).orElse("").toLowerCase();
            return body.contains("already exists")
                    || body.contains("exists with same")
                    || body.contains("duplicate")
                    || body.contains("username")
                    || body.contains("email");
        }

        return false;
    }
}
