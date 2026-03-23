package io.dvloper.backend.controller;

import io.dvloper.backend.dto.PagedResponse;
import io.dvloper.backend.entities.Category;
import io.dvloper.backend.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Category", description = "Category management")
public class CategoryController {

    private final CategoryRepository repository;

    public CategoryController(CategoryRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<PagedResponse<Category>> getAllCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String id) {

        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        String normalizedSortBy = normalizeCategorySortBy(sortBy);
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize, Sort.by(direction, normalizedSortBy));

        Specification<Category> spec = Specification.<Category>where(null)
                .and(containsIgnoreCase("name", name))
                .and(containsIgnoreCase("description", description))
                .and(idLike(id));

        Page<Category> result = repository.findAll(spec, pageable);
        PagedResponse<Category> response = new PagedResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable UUID id) {
        return repository.findById(id)
                .map(category -> ResponseEntity.ok(category))
                .orElse(ResponseEntity.notFound().build()); // 404 Not Found
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(@Valid @RequestBody Category category) {
        // @Valid checks if the incoming Category object meets validation constraints
        // (e.g., @NotBlank)
        Category savedCategory = repository.save(category);
        // Return 201 Created
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable UUID id, @RequestBody Category categoryDetails) {
        return repository.findById(id)
                .map(category -> {
                    // Update only non-null fields from request
                    if (categoryDetails.getName() != null) {
                        category.setName(categoryDetails.getName());
                    }
                    if (categoryDetails.getDescription() != null) {
                        category.setDescription(categoryDetails.getDescription());
                    }
                    Category updatedCategory = repository.save(category);
                    return ResponseEntity.ok(updatedCategory);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build(); // 204 No Content (success without body)
        }
        return ResponseEntity.notFound().build();
    }

    private Specification<Category> containsIgnoreCase(String field, String value) {
        return (root, query, cb) -> {
            if (value == null || value.isBlank()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get(field)), "%" + value.toLowerCase() + "%");
        };
    }

    private Specification<Category> idLike(String value) {
        return (root, query, cb) -> {
            if (value == null || value.isBlank()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("id").as(String.class)), "%" + value.toLowerCase() + "%");
        };
    }

    private String normalizeCategorySortBy(String sortBy) {
        return switch (sortBy) {
            case "id", "name", "description" -> sortBy;
            default -> "name";
        };
    }
}