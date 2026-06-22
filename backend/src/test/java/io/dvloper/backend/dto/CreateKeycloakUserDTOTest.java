package io.dvloper.backend.dto;

import org.junit.jupiter.api.Test;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class CreateKeycloakUserDTOTest {

    private final Validator validator;

    public CreateKeycloakUserDTOTest() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testDefaultConstructor() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();

        assertNotNull(dto);
        assertNull(dto.getUsername());
        assertNull(dto.getEmail());
        assertNull(dto.getFirstName());
        assertNull(dto.getLastName());
        assertNull(dto.getPassword());
        assertTrue(dto.getEnabled()); // Default is true
        assertNull(dto.getRoles());
    }

    @Test
    void testParameterizedConstructor() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO(
                "john_doe",
                "john@example.com",
                "John",
                "Doe",
                "password123");

        assertEquals("john_doe", dto.getUsername());
        assertEquals("john@example.com", dto.getEmail());
        assertEquals("John", dto.getFirstName());
        assertEquals("Doe", dto.getLastName());
        assertEquals("password123", dto.getPassword());
    }

    @Test
    void testGettersAndSetters() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        List<String> roles = Arrays.asList("Admin", "Employee");

        dto.setUsername("testuser");
        dto.setEmail("test@example.com");
        dto.setFirstName("Test");
        dto.setLastName("User");
        dto.setPassword("testpass");
        dto.setEnabled(false);
        dto.setRoles(roles);

        assertEquals("testuser", dto.getUsername());
        assertEquals("test@example.com", dto.getEmail());
        assertEquals("Test", dto.getFirstName());
        assertEquals("User", dto.getLastName());
        assertEquals("testpass", dto.getPassword());
        assertFalse(dto.getEnabled());
        assertEquals(roles, dto.getRoles());
    }

    @Test
    void testValidDTO() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO(
                "validuser",
                "valid@example.com",
                "Valid",
                "User",
                "password");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.isEmpty(), "Valid DTO should have no violations");
    }

    @Test
    void testUsernameNotBlank() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("");
        dto.setEmail("test@example.com");
        dto.setFirstName("First");
        dto.setLastName("Last");
        dto.setPassword("password");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("username")));
    }

    @Test
    void testUsernameMinLength() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("ab");
        dto.setEmail("test@example.com");
        dto.setFirstName("First");
        dto.setLastName("Last");
        dto.setPassword("password");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("username")));
    }

    @Test
    void testUsernameMaxLength() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("a".repeat(51));
        dto.setEmail("test@example.com");
        dto.setFirstName("First");
        dto.setLastName("Last");
        dto.setPassword("password");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("username")));
    }

    @Test
    void testEmailNotBlank() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("username");
        dto.setEmail("");
        dto.setFirstName("First");
        dto.setLastName("Last");
        dto.setPassword("password");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }

    @Test
    void testEmailInvalid() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("username");
        dto.setEmail("invalid-email");
        dto.setFirstName("First");
        dto.setLastName("Last");
        dto.setPassword("password");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }

    @Test
    void testFirstNameNotBlank() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("username");
        dto.setEmail("test@example.com");
        dto.setFirstName("");
        dto.setLastName("Last");
        dto.setPassword("password");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("firstName")));
    }

    @Test
    void testFirstNameMinLength() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("username");
        dto.setEmail("test@example.com");
        dto.setFirstName("A");
        dto.setLastName("Last");
        dto.setPassword("password");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("firstName")));
    }

    @Test
    void testLastNameNotBlank() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("username");
        dto.setEmail("test@example.com");
        dto.setFirstName("First");
        dto.setLastName("");
        dto.setPassword("password");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("lastName")));
    }

    @Test
    void testPasswordNotBlank() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("username");
        dto.setEmail("test@example.com");
        dto.setFirstName("First");
        dto.setLastName("Last");
        dto.setPassword("");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }

    @Test
    void testPasswordMinLength() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("username");
        dto.setEmail("test@example.com");
        dto.setFirstName("First");
        dto.setLastName("Last");
        dto.setPassword("abc");

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }

    @Test
    void testPasswordMaxLength() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("username");
        dto.setEmail("test@example.com");
        dto.setFirstName("First");
        dto.setLastName("Last");
        dto.setPassword("a".repeat(101));

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }

    @Test
    void testDefaultEnabledValue() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        assertTrue(dto.getEnabled(), "Default enabled should be true");
    }

    @Test
    void testWithRoles() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO(
                "username",
                "test@example.com",
                "First",
                "Last",
                "password");
        List<String> roles = Arrays.asList("Admin", "Employee");
        dto.setRoles(roles);

        assertEquals(roles, dto.getRoles());
        assertEquals(2, dto.getRoles().size());
    }

    @Test
    void testNullRoles() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setRoles(null);
        assertNull(dto.getRoles());
    }

    @Test
    void testValidEmailFormats() {
        String[] validEmails = {
                "test@example.com",
                "user.name@example.com",
                "user+tag@example.co.uk",
                "123@example.com"
        };

        for (String email : validEmails) {
            CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO(
                    "username",
                    email,
                    "First",
                    "Last",
                    "password");

            Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
            assertTrue(violations.stream()
                    .noneMatch(v -> v.getPropertyPath().toString().equals("email")),
                    "Email " + email + " should be valid");
        }
    }

    @Test
    void testBoundaryValues() {
        CreateKeycloakUserDTO dto = new CreateKeycloakUserDTO();
        dto.setUsername("abc"); // min 3
        dto.setEmail("a@b.c");
        dto.setFirstName("AB"); // min 2
        dto.setLastName("CD"); // min 2
        dto.setPassword("pass"); // min 4

        Set<ConstraintViolation<CreateKeycloakUserDTO>> violations = validator.validate(dto);
        assertTrue(violations.isEmpty(), "Minimum boundary values should be valid");

        dto.setUsername("a".repeat(50)); // max 50
        dto.setFirstName("a".repeat(50)); // max 50
        dto.setLastName("a".repeat(50)); // max 50
        dto.setPassword("a".repeat(100)); // max 100

        violations = validator.validate(dto);
        assertTrue(violations.isEmpty(), "Maximum boundary values should be valid");
    }
}
