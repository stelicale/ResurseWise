package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Resource;
import io.dvloper.backend.repository.ResourceRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
@Tag(name = "Resource", description = "Resource management")
public class ResourceController {

    private final ResourceRepository repository;

    public ResourceController(ResourceRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Resource> getAllResources() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable UUID id) {
        return repository.findById(id)
                .map(resource -> ResponseEntity.ok(resource))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Resource> createResource(@Valid @RequestBody Resource resource) {
        // The incoming JSON must contain nested objects or IDs for category
        // Example: { "name": "Phone", "category": { "id": "..." } }
        Resource savedResource = repository.save(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedResource);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable UUID id,
            @RequestBody Resource resourceDetails) {
        return repository.findById(id)
                .map(resource -> {
                    // Update only non-null fields from request
                    if (resourceDetails.getSerialNumber() != null) {
                        resource.setSerialNumber(resourceDetails.getSerialNumber());
                    }
                    if (resourceDetails.getName() != null) {
                        resource.setName(resourceDetails.getName());
                    }
                    if (resourceDetails.getModel() != null) {
                        resource.setModel(resourceDetails.getModel());
                    }
                    if (resourceDetails.getLocation() != null) {
                        resource.setLocation(resourceDetails.getLocation());
                    }
                    if (resourceDetails.getStatus() != null) {
                        resource.setStatus(resourceDetails.getStatus());
                    }
                    if (resourceDetails.getPurchaseDate() != null) {
                        resource.setPurchaseDate(resourceDetails.getPurchaseDate());
                    }
                    if (resourceDetails.getCategory() != null) {
                        resource.setCategory(resourceDetails.getCategory());
                    }

                    return ResponseEntity.ok(repository.save(resource));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable UUID id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}