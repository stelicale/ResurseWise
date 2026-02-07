package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Resource;
import io.dvloper.backend.repository.ResourceRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
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
        // The incoming JSON must contain nested objects or IDs for category/employee
        // Example: { "name": "Phone", "category": { "id": "..." } }
        Resource savedResource = repository.save(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedResource);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable UUID id, @Valid @RequestBody Resource resourceDetails) {
        return repository.findById(id)
                .map(resource -> {
                    resource.setName(resourceDetails.getName());
                    resource.setModel(resourceDetails.getModel());
                    resource.setLocation(resourceDetails.getLocation());
                    resource.setStatus(resourceDetails.getStatus());
                    // We can also update relationships
                    resource.setCategory(resourceDetails.getCategory());
                    resource.setEmployee(resourceDetails.getEmployee());
                    
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