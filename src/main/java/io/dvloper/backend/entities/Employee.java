package io.dvloper.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

@Entity
@Table(name = "employees")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "keycloak_id", unique = true)
    private String keycloakId;

    @Column(unique = true)
    @NotBlank(message = "Email cannot be empty")
    @jakarta.validation.constraints.Pattern(regexp = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", message = "Email must contain a single '@' and at least one '.'")
    @Size(min = 5, max = 100, message = "Email must be between 5 and 100 characters")
    private String email;

    @NotBlank(message = "Full name cannot be empty")
    @Size(min = 3, max = 100, message = "Full name must be between 3 and 100 characters")
    private String fullName;

    @NotBlank(message = "Department cannot be empty")
    @Size(min = 2, max = 50, message = "Department must be between 2 and 50 characters")
    private String department;

    @NotBlank(message = "Job cannot be empty")
    @Size(min = 2, max = 50, message = "Job must be between 2 and 50 characters")
    private String job;

    public Employee() {}

    public Employee(UUID id, String email, String fullName, String department, String job) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.department = department;
        this.job = job;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getJob() { return job; }
    public void setJob(String job) { this.job = job; }
}