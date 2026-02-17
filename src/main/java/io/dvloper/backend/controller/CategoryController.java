package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Category;
import io.dvloper.backend.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    public List<Category> getAllCategories() {
        return repository.findAll();
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
}