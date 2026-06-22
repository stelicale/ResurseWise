package io.dvloper.backend.dto;

import org.junit.jupiter.api.Test;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class KeycloakUserDTOTest {

    @Test
    void testDefaultConstructor() {
        KeycloakUserDTO dto = new KeycloakUserDTO();

        assertNotNull(dto);
        assertNull(dto.getId());
        assertNull(dto.getEmail());
        assertNull(dto.getUsername());
        assertNull(dto.getFirstName());
        assertNull(dto.getLastName());
        assertNull(dto.getEnabled());
        assertNull(dto.getRoles());
    }

    @Test
    void testParameterizedConstructor() {
        UUID id = UUID.randomUUID();
        KeycloakUserDTO dto = new KeycloakUserDTO(
                id,
                "john@example.com",
                "john_doe",
                "John",
                "Doe");

        assertEquals(id, dto.getId());
        assertEquals("john@example.com", dto.getEmail());
        assertEquals("john_doe", dto.getUsername());
        assertEquals("John", dto.getFirstName());
        assertEquals("Doe", dto.getLastName());
    }

    @Test
    void testGettersAndSetters() {
        KeycloakUserDTO dto = new KeycloakUserDTO();
        UUID id = UUID.randomUUID();
        List<String> roles = Arrays.asList("Admin", "Employee");

        dto.setId(id);
        dto.setEmail("test@example.com");
        dto.setUsername("testuser");
        dto.setFirstName("Test");
        dto.setLastName("User");
        dto.setEnabled(true);
        dto.setRoles(roles);

        assertEquals(id, dto.getId());
        assertEquals("test@example.com", dto.getEmail());
        assertEquals("testuser", dto.getUsername());
        assertEquals("Test", dto.getFirstName());
        assertEquals("User", dto.getLastName());
        assertTrue(dto.getEnabled());
        assertEquals(roles, dto.getRoles());
        assertEquals(2, dto.getRoles().size());
        assertTrue(dto.getRoles().contains("Admin"));
        assertTrue(dto.getRoles().contains("Employee"));
    }

    @Test
    void testWithNullValues() {
        KeycloakUserDTO dto = new KeycloakUserDTO();

        dto.setId(null);
        dto.setEmail(null);
        dto.setUsername(null);
        dto.setFirstName(null);
        dto.setLastName(null);
        dto.setEnabled(null);
        dto.setRoles(null);

        assertNull(dto.getId());
        assertNull(dto.getEmail());
        assertNull(dto.getUsername());
        assertNull(dto.getFirstName());
        assertNull(dto.getLastName());
        assertNull(dto.getEnabled());
        assertNull(dto.getRoles());
    }

    @Test
    void testWithEmptyRoles() {
        KeycloakUserDTO dto = new KeycloakUserDTO();
        dto.setRoles(Arrays.asList());

        assertNotNull(dto.getRoles());
        assertTrue(dto.getRoles().isEmpty());
    }

    @Test
    void testWithMultipleRoles() {
        KeycloakUserDTO dto = new KeycloakUserDTO();
        List<String> roles = Arrays.asList("Admin", "Employee", "Manager", "Developer");
        dto.setRoles(roles);

        assertEquals(4, dto.getRoles().size());
        assertTrue(dto.getRoles().contains("Manager"));
        assertTrue(dto.getRoles().contains("Developer"));
    }

    @Test
    void testEnabledFalse() {
        KeycloakUserDTO dto = new KeycloakUserDTO();
        dto.setEnabled(false);

        assertNotNull(dto.getEnabled());
        assertFalse(dto.getEnabled());
    }

    @Test
    void testCompleteUserDTO() {
        UUID id = UUID.randomUUID();
        KeycloakUserDTO dto = new KeycloakUserDTO(
                id,
                "admin@company.com",
                "admin123",
                "Admin",
                "User");
        dto.setEnabled(true);
        dto.setRoles(Arrays.asList("Admin"));

        assertEquals(id, dto.getId());
        assertEquals("admin@company.com", dto.getEmail());
        assertEquals("admin123", dto.getUsername());
        assertEquals("Admin", dto.getFirstName());
        assertEquals("User", dto.getLastName());
        assertTrue(dto.getEnabled());
        assertEquals(1, dto.getRoles().size());
        assertEquals("Admin", dto.getRoles().get(0));
    }

    @Test
    void testIdGeneration() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();

        KeycloakUserDTO dto1 = new KeycloakUserDTO();
        KeycloakUserDTO dto2 = new KeycloakUserDTO();

        dto1.setId(id1);
        dto2.setId(id2);

        assertNotEquals(dto1.getId(), dto2.getId());
    }
}
