package io.dvloper.backend.entities;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "resources")
public class Resource {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String serialNumber;
    private String name;
    private String model;
    private String status;
    private LocalDate purchaseDate;
    private String location;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    public Resource() {}

    public Resource(String name, String serialNumber, Category category) {
        this.name = name;
        this.serialNumber = serialNumber;
        this.category = category;
        this.status = "AVAILABLE"; // Default
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public void setEmployee(Employee employee) { this.employee = employee; }
    public Employee getEmployee() { return employee; }

    public void setCategory(Category category) { this.category = category; }
    public Category getCategory() { return category; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}