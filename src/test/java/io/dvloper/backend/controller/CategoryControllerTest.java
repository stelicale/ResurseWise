package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Category;
import io.dvloper.backend.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@WebMvcTest(value = CategoryController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {
        io.dvloper.backend.config.SecurityConfig.class }))
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CategoryRepository repository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetAllCategories() throws Exception {
        Category cat1 = createCategory("Laptops", "High performance");
        Category cat2 = createCategory("Monitors", "Display devices");

        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(cat1, cat2)));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].name", is("Laptops")))
                .andExpect(jsonPath("$.content[1].name", is("Monitors")));
    }

    @Test
    void testGetCategoryById() throws Exception {
        UUID id = UUID.randomUUID();
        Category category = createCategory("Laptops", "High performance");
        category.setId(id);

        when(repository.findById(id)).thenReturn(Optional.of(category));

        mockMvc.perform(get("/api/categories/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Laptops")))
                .andExpect(jsonPath("$.description", is("High performance")));
    }

    @Test
    void testGetCategoryByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();

        when(repository.findById(id)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/categories/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateCategory() throws Exception {
        Category category = createCategory("Laptops", "High performance");
        Category savedCategory = createCategory("Laptops", "High performance");
        savedCategory.setId(UUID.randomUUID());

        when(repository.save(any(Category.class))).thenReturn(savedCategory);

        mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(category)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Laptops")))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void testUpdateCategory() throws Exception {
        UUID id = UUID.randomUUID();
        Category existing = createCategory("Laptops", "Old description");
        existing.setId(id);

        Category updated = createCategory("Gaming Laptops", "New description");
        updated.setId(id);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(Category.class))).thenReturn(updated);

        mockMvc.perform(put("/api/categories/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Gaming Laptops")))
                .andExpect(jsonPath("$.description", is("New description")));
    }

    @Test
    void testUpdateCategoryNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        Category category = createCategory("Laptops", "Description");

        when(repository.findById(id)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/categories/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(category)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteCategory() throws Exception {
        UUID id = UUID.randomUUID();

        when(repository.existsById(id)).thenReturn(true);
        doNothing().when(repository).deleteById(id);

        mockMvc.perform(delete("/api/categories/{id}", id))
                .andExpect(status().isNoContent());

        verify(repository, times(1)).deleteById(id);
    }

    @Test
    void testDeleteCategoryNotFound() throws Exception {
        UUID id = UUID.randomUUID();

        when(repository.existsById(id)).thenReturn(false);

        mockMvc.perform(delete("/api/categories/{id}", id))
                .andExpect(status().isNotFound());

        verify(repository, never()).deleteById(any());
    }

    @Test
    void testCreateCategoryInvalidData() throws Exception {
        Category invalid = new Category("", ""); // Empty fields - should fail validation

        mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateCategoryDuplicateReturnsConflict() throws Exception {
        Category category = createCategory("Laptops", "High performance computers");

        when(repository.existsByNameIgnoreCaseAndDescriptionIgnoreCase(anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(category)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    void testGetAllCategoriesEmpty() throws Exception {
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList()));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    void testUpdateCategoryPartialUpdate() throws Exception {
        UUID id = UUID.randomUUID();
        Category existing = createCategory("Laptops", "Old description");
        existing.setId(id);

        Category partial = new Category();
        partial.setName("Updated Name");

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/categories/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(partial)))
                .andExpect(status().isOk());
    }

    private Category createCategory(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return category;
    }
}
