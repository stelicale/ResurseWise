package io.dvloper.backend.entities;

import org.junit.jupiter.api.Test;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ResourceTest {

    private final Validator validator;

    public ResourceTest() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void testDefaultConstructor() {
        Resource resource = new Resource();
        assertNotNull(resource);
        assertNull(resource.getId());
        assertNull(resource.getName());
        assertNull(resource.getSerialNumber());
    }

    @Test
    void testParameterizedConstructor() {
        Category category = new Category("Laptops", "High performance");
        Resource resource = new Resource("MacBook Pro", "SN-123", category);

        assertNotNull(resource);
        assertEquals("MacBook Pro", resource.getName());
        assertEquals("SN-123", resource.getSerialNumber());
        assertEquals("AVAILABLE", resource.getStatus());
        assertEquals(category, resource.getCategory());
    }

    @Test
    void testGettersAndSetters() {
        Resource resource = new Resource();
        UUID testId = UUID.randomUUID();
        Category category = new Category("Test", "Test Desc");
        LocalDate date = LocalDate.of(2024, 1, 15);

        resource.setId(testId);
        resource.setName("Test Resource");
        resource.setSerialNumber("SN-999");
        resource.setModel("Model X");
        resource.setStatus("IN_USE");
        resource.setPurchaseDate(date);
        resource.setLocation("Office A");
        resource.setCategory(category);

        assertEquals(testId, resource.getId());
        assertEquals("Test Resource", resource.getName());
        assertEquals("SN-999", resource.getSerialNumber());
        assertEquals("Model X", resource.getModel());
        assertEquals("IN_USE", resource.getStatus());
        assertEquals(date, resource.getPurchaseDate());
        assertEquals("Office A", resource.getLocation());
        assertEquals(category, resource.getCategory());
    }

    @Test
    void testValidResource() {
        Category category = new Category("Laptops", "High performance");
        Resource resource = new Resource("MacBook Pro", "SN-123", category);
        resource.setModel("M3 Pro");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("Office");

        Set<ConstraintViolation<Resource>> violations = validator.validate(resource);
        assertTrue(violations.isEmpty(), "Valid resource should have no violations");
    }

    @Test
    void testSerialNumberNotBlank() {
        Resource resource = new Resource();
        resource.setSerialNumber("");
        resource.setName("Name");
        resource.setModel("Model");
        resource.setStatus("AVAILABLE");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("Office");

        Set<ConstraintViolation<Resource>> violations = validator.validate(resource);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("serialNumber")));
    }

    @Test
    void testNameNotBlank() {
        Resource resource = new Resource();
        resource.setSerialNumber("SN-123");
        resource.setName("");
        resource.setModel("Model");
        resource.setStatus("AVAILABLE");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("Office");

        Set<ConstraintViolation<Resource>> violations = validator.validate(resource);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    void testModelNotBlank() {
        Resource resource = new Resource();
        resource.setSerialNumber("SN-123");
        resource.setName("Name");
        resource.setModel("");
        resource.setStatus("AVAILABLE");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("Office");

        Set<ConstraintViolation<Resource>> violations = validator.validate(resource);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("model")));
    }

    @Test
    void testStatusNotBlank() {
        Resource resource = new Resource();
        resource.setSerialNumber("SN-123");
        resource.setName("Name");
        resource.setModel("Model");
        resource.setStatus("");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("Office");

        Set<ConstraintViolation<Resource>> violations = validator.validate(resource);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("status")));
    }

    @Test
    void testLocationNotBlank() {
        Resource resource = new Resource();
        resource.setSerialNumber("SN-123");
        resource.setName("Name");
        resource.setModel("Model");
        resource.setStatus("AVAILABLE");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("");

        Set<ConstraintViolation<Resource>> violations = validator.validate(resource);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("location")));
    }

    @Test
    void testPurchaseDateNotNull() {
        Resource resource = new Resource();
        resource.setSerialNumber("SN-123");
        resource.setName("Name");
        resource.setModel("Model");
        resource.setStatus("AVAILABLE");
        resource.setLocation("Office");
        resource.setPurchaseDate(null);

        Set<ConstraintViolation<Resource>> violations = validator.validate(resource);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("purchaseDate")));
    }

    @Test
    void testFieldMaxLength() {
        Resource resource = new Resource();
        resource.setSerialNumber("A".repeat(101));
        resource.setName("Name");
        resource.setModel("Model");
        resource.setStatus("AVAILABLE");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("Office");

        Set<ConstraintViolation<Resource>> violations = validator.validate(resource);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("serialNumber")));
    }

    @Test
    void testNullSerialNumber() {
        Resource resource = new Resource();
        resource.setSerialNumber(null);
        resource.setName("Name");
        resource.setModel("Model");
        resource.setStatus("AVAILABLE");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("Office");

        Set<ConstraintViolation<Resource>> violations = validator.validate(resource);
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("serialNumber")));
    }

    @Test
    void testDefaultStatusInConstructor() {
        Category category = new Category("Laptops", "Test");
        Resource resource = new Resource("MacBook", "SN-123", category);

        assertEquals("AVAILABLE", resource.getStatus());
    }

    @Test
    void testCategoryAssociation() {
        Category category1 = new Category("Laptops", "Computers");
        Category category2 = new Category("Monitors", "Displays");

        Resource resource = new Resource("MacBook", "SN-123", category1);
        assertEquals(category1, resource.getCategory());

        resource.setCategory(category2);
        assertEquals(category2, resource.getCategory());
    }

    @Test
    void testValidBoundaryValues() {
        Category category = new Category("Test", "Test Description");
        Resource resource = new Resource();
        resource.setSerialNumber("A");
        resource.setName("B");
        resource.setModel("C");
        resource.setStatus("D");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("E");
        resource.setCategory(category);

        Set<ConstraintViolation<Resource>> violations = validator.validate(resource);
        assertTrue(violations.isEmpty(), "Minimum valid values should pass validation");

        resource.setSerialNumber("A".repeat(100));
        resource.setName("B".repeat(100));
        resource.setModel("C".repeat(100));
        resource.setStatus("D".repeat(100));
        resource.setLocation("E".repeat(100));

        violations = validator.validate(resource);
        assertTrue(violations.isEmpty(), "Maximum valid values should pass validation");
    }
}
