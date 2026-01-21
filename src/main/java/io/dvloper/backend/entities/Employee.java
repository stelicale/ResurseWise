package io.dvloper.backend.entities;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "employees")
public class Employee {
    @Id
    // Is manually set from the Keycloak token
    private UUID id;

    @Column(unique = true) 
    private String email;

    private String fullName;
    private String department;
    private String jobTitle;

    public Employee() {}

    public Employee(UUID id, String email, String fullName, String department, String jobTitle) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.department = department;
        this.jobTitle = jobTitle;
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

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
}