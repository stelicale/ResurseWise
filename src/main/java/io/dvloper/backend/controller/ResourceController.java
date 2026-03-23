package io.dvloper.backend.controller;

import io.dvloper.backend.dto.PagedResponse;
import io.dvloper.backend.entities.Resource;
import io.dvloper.backend.repository.LogRepository;
import io.dvloper.backend.repository.ResourceRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
@Tag(name = "Resource", description = "Resource management")
public class ResourceController {

    private final ResourceRepository repository;
    private final LogRepository logRepository;

    public ResourceController(ResourceRepository repository, LogRepository logRepository) {
        this.repository = repository;
        this.logRepository = logRepository;
    }

    @GetMapping
    public ResponseEntity<PagedResponse<Resource>> getAllResources(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String serialNumber,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String categoryName) {

        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);

        String normalizedSortBy = normalizeResourceSortBy(sortBy);
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by(direction, normalizedSortBy));

        Specification<Resource> spec = Specification.<Resource>where(null)
                .and(containsIgnoreCase("name", name))
                .and(containsIgnoreCase("model", model))
                .and(containsIgnoreCase("serialNumber", serialNumber))
                .and(containsIgnoreCase("status", status))
                .and(containsIgnoreCase("location", location))
                .and(containsCategoryName(categoryName));

        Page<Resource> result = repository.findAll(spec, pageable);
        PagedResponse<Resource> response = new PagedResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());

        return ResponseEntity.ok(response);
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
    @Transactional
    public ResponseEntity<Void> deleteResource(@PathVariable UUID id) {
        if (repository.existsById(id)) {
            // Keep audit history while allowing resource deletion.
            logRepository.detachResourceReferences(id);
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    private Specification<Resource> containsIgnoreCase(String field, String value) {
        return (root, query, cb) -> {
            if (value == null || value.isBlank()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get(field)), "%" + value.toLowerCase() + "%");
        };
    }

    private Specification<Resource> containsCategoryName(String value) {
        return (root, query, cb) -> {
            if (value == null || value.isBlank()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.join("category", jakarta.persistence.criteria.JoinType.LEFT).get("name")),
                    "%" + value.toLowerCase() + "%");
        };
    }

    private String normalizeResourceSortBy(String sortBy) {
        return switch (sortBy) {
            case "name", "model", "serialNumber", "status", "location", "purchaseDate" -> sortBy;
            case "categoryName" -> "category.name";
            default -> "name";
        };
    }
}