package io.dvloper.backend.entities;

import org.junit.jupiter.api.Test;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class LogTest {

    private final Validator validator;

    public LogTest() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testDefaultConstructor() {
        Log log = new Log();
        assertNotNull(log);
        assertNull(log.getId());
        assertNull(log.getActionType());
        assertNull(log.getComments());
    }

    @Test
    void testParameterizedConstructor() {
        Category category = new Category("Laptops", "Test");
        Resource resource = new Resource("MacBook", "SN-123", category);
        UUID userId = UUID.randomUUID();

        LocalDateTime beforeCreation = LocalDateTime.now().minusSeconds(1);
        Log log = new Log("ASSIGN", resource, userId, "Assigned to user");
        LocalDateTime afterCreation = LocalDateTime.now().plusSeconds(1);

        assertNotNull(log);
        assertEquals("ASSIGN", log.getActionType());
        assertEquals(resource, log.getResource());
        assertEquals(userId, log.getCreatedByKeycloakId());
        assertEquals("Assigned to user", log.getComments());
        assertNotNull(log.getActionDate());
        assertTrue(log.getActionDate().isAfter(beforeCreation) || log.getActionDate().isEqual(beforeCreation));
        assertTrue(log.getActionDate().isBefore(afterCreation) || log.getActionDate().isEqual(afterCreation));
    }

    @Test
    void testGettersAndSetters() {
        Log log = new Log();
        UUID testId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        LocalDateTime date = LocalDateTime.of(2024, 1, 15, 10, 30);

        Category category = new Category("Test", "Test Desc");
        Resource resource = new Resource("Test", "SN-999", category);

        log.setId(testId);
        log.setActionType("UPDATE");
        log.setActionDate(date);
        log.setComments("Test comments");
        log.setResource(resource);
        log.setCreatedByKeycloakId(userId);

        assertEquals(testId, log.getId());
        assertEquals("UPDATE", log.getActionType());
        assertEquals(date, log.getActionDate());
        assertEquals("Test comments", log.getComments());
        assertEquals(resource, log.getResource());
        assertEquals(userId, log.getCreatedByKeycloakId());
    }

    @Test
    void testValidLog() {
        Category category = new Category("Laptops", "Test");
        Resource resource = new Resource("MacBook", "SN-123", category);
        UUID userId = UUID.randomUUID();

        Log log = new Log("ASSIGN", resource, userId, "Assigned to user");

        Set<ConstraintViolation<Log>> violations = validator.validate(log);
        assertTrue(violations.isEmpty(), "Valid log should have no violations");
    }

    @Test
    void testActionTypeNotBlank() {
        Log log = new Log();
        log.setActionType("");
        log.setActionDate(LocalDateTime.now());
        log.setComments("Comments");

        Set<ConstraintViolation<Log>> violations = validator.validate(log);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("actionType")));
    }

    @Test
    void testActionTypeMinLength() {
        Log log = new Log();
        log.setActionType("AB");
        log.setActionDate(LocalDateTime.now());
        log.setComments("Comments");

        Set<ConstraintViolation<Log>> violations = validator.validate(log);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("actionType")));
    }

    @Test
    void testActionTypeMaxLength() {
        Log log = new Log();
        log.setActionType("A".repeat(51));
        log.setActionDate(LocalDateTime.now());
        log.setComments("Comments");

        Set<ConstraintViolation<Log>> violations = validator.validate(log);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("actionType")));
    }

    @Test
    void testActionDateNotNull() {
        Log log = new Log();
        log.setActionType("ASSIGN");
        log.setActionDate(null);
        log.setComments("Comments");

        Set<ConstraintViolation<Log>> violations = validator.validate(log);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("actionDate")));
    }

    @Test
    void testCommentsNotBlank() {
        Log log = new Log();
        log.setActionType("ASSIGN");
        log.setActionDate(LocalDateTime.now());
        log.setComments("");

        Set<ConstraintViolation<Log>> violations = validator.validate(log);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("comments")));
    }

    @Test
    void testCommentsMaxLength() {
        Log log = new Log();
        log.setActionType("ASSIGN");
        log.setActionDate(LocalDateTime.now());
        log.setComments("A".repeat(1001));

        Set<ConstraintViolation<Log>> violations = validator.validate(log);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("comments")));
    }

    @Test
    void testNullActionType() {
        Log log = new Log();
        log.setActionType(null);
        log.setActionDate(LocalDateTime.now());
        log.setComments("Comments");

        Set<ConstraintViolation<Log>> violations = validator.validate(log);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("actionType")));
    }

    @Test
    void testNullComments() {
        Log log = new Log();
        log.setActionType("ASSIGN");
        log.setActionDate(LocalDateTime.now());
        log.setComments(null);

        Set<ConstraintViolation<Log>> violations = validator.validate(log);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("comments")));
    }

    @Test
    void testResourceAssociation() {
        Category category1 = new Category("Laptops", "Computers");
        Category category2 = new Category("Monitors", "Displays");

        Resource resource1 = new Resource("MacBook", "SN-123", category1);
        Resource resource2 = new Resource("Dell Monitor", "SN-456", category2);
        UUID userId = UUID.randomUUID();

        Log log = new Log("ASSIGN", resource1, userId, "Test");
        assertEquals(resource1, log.getResource());

        log.setResource(resource2);
        assertEquals(resource2, log.getResource());
    }

    @Test
    void testValidBoundaryValues() {
        Category category = new Category("Test", "Test Description");
        Resource resource = new Resource("MacBook", "SN-123", category);
        UUID userId = UUID.randomUUID();

        Log log = new Log();
        log.setActionType("ABC");
        log.setActionDate(LocalDateTime.now());
        log.setComments("A");
        log.setResource(resource);
        log.setCreatedByKeycloakId(userId);

        Set<ConstraintViolation<Log>> violations = validator.validate(log);
        assertTrue(violations.isEmpty(), "Minimum valid values should pass validation");

        log.setActionType("A".repeat(50));
        log.setComments("B".repeat(1000));

        violations = validator.validate(log);
        assertTrue(violations.isEmpty(), "Maximum valid values should pass validation");
    }

    @Test
    void testConstructorSetsActionDate() {
        Category category = new Category("Test", "Test Description");
        Resource resource = new Resource("MacBook", "SN-123", category);
        UUID userId = UUID.randomUUID();

        Log log = new Log("ASSIGN", resource, userId, "Test comment");

        assertNotNull(log.getActionDate(), "Constructor should set action date");
    }

    @Test
    void testMultipleActionTypes() {
        Category category = new Category("Test", "Test Description");
        Resource resource = new Resource("MacBook", "SN-123", category);
        UUID userId = UUID.randomUUID();

        Log log1 = new Log("ASSIGN", resource, userId, "Assigned");
        Log log2 = new Log("UNASSIGN", resource, userId, "Unassigned");
        Log log3 = new Log("REPAIR", resource, userId, "Repaired");
        Log log4 = new Log("RETIRE", resource, userId, "Retired");

        Set<ConstraintViolation<Log>> violations1 = validator.validate(log1);
        Set<ConstraintViolation<Log>> violations2 = validator.validate(log2);
        Set<ConstraintViolation<Log>> violations3 = validator.validate(log3);
        Set<ConstraintViolation<Log>> violations4 = validator.validate(log4);

        assertTrue(violations1.isEmpty());
        assertTrue(violations2.isEmpty());
        assertTrue(violations3.isEmpty());
        assertTrue(violations4.isEmpty());
    }
}
