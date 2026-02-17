package io.dvloper.backend.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "logs")
public class Log {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Action type cannot be empty")
    @Size(min = 3, max = 50, message = "Action type must be between 3 and 50 characters")
    private String actionType;

    @NotNull(message = "Action date is required")
    private LocalDateTime actionDate;

    @Column(columnDefinition = "TEXT")
    @NotBlank(message = "Comments cannot be empty")
    @Size(min = 1, max = 1000, message = "Comments must be between 1 and 1000 characters")
    private String comments;

    @ManyToOne
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @Column(name = "created_by_keycloak_id")
    private UUID createdByKeycloakId;

    public Log() {
    }

    public Log(String actionType, Resource resource, UUID createdByKeycloakId, String comments) {
        this.actionType = actionType;
        this.resource = resource;
        this.createdByKeycloakId = createdByKeycloakId;
        this.comments = comments;
        this.actionDate = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public LocalDateTime getActionDate() {
        return actionDate;
    }

    public void setActionDate(LocalDateTime actionDate) {
        this.actionDate = actionDate;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public Resource getResource() {
        return resource;
    }

    public void setResource(Resource resource) {
        this.resource = resource;
    }

    public UUID getCreatedByKeycloakId() {
        return createdByKeycloakId;
    }

    public void setCreatedByKeycloakId(UUID createdByKeycloakId) {
        this.createdByKeycloakId = createdByKeycloakId;
    }
}