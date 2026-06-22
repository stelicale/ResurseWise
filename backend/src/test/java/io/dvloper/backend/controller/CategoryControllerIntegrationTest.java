package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Category;
import io.dvloper.backend.repository.CategoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class CategoryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CategoryRepository repository;

    @Autowired
    private ObjectMapper objectMapper;

    @AfterEach
    void cleanup() {
        repository.deleteAll();
    }

    @Test
    void testGetAllCategoriesIntegration() throws Exception {
        Category category1 = new Category();
        category1.setName("Category 1");
        category1.setDescription("Description 1");
        repository.save(category1);

        Category category2 = new Category();
        category2.setName("Category 2");
        category2.setDescription("Description 2");
        repository.save(category2);

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].name", is("Category 1")))
                .andExpect(jsonPath("$.content[1].name", is("Category 2")));
    }

    @Test
    void testGetCategoryByIdIntegration() throws Exception {
        Category category = new Category();
        category.setName("Test Category");
        category.setDescription("Test Description");
        Category saved = repository.save(category);

        mockMvc.perform(get("/api/categories/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Test Category")))
                .andExpect(jsonPath("$.description", is("Test Description")));
    }

    @Test
    void testCreateCategoryIntegration() throws Exception {
        Category category = new Category();
        category.setName("New Category");
        category.setDescription("New Description");

        mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(category)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("New Category")))
                .andExpect(jsonPath("$.description", is("New Description")));
    }

    @Test
    void testUpdateCategoryIntegration() throws Exception {
        Category category = new Category();
        category.setName("Original Name");
        category.setDescription("Original Description");
        Category saved = repository.save(category);

        saved.setName("Updated Name");
        saved.setDescription("Updated Description");

        mockMvc.perform(put("/api/categories/" + saved.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(saved)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Name")))
                .andExpect(jsonPath("$.description", is("Updated Description")));
    }

    @Test
    void testDeleteCategoryIntegration() throws Exception {
        Category category = new Category();
        category.setName("To Delete");
        category.setDescription("Will be deleted");
        Category saved = repository.save(category);

        mockMvc.perform(delete("/api/categories/" + saved.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/categories/" + saved.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetCategoryByIdNotFoundIntegration() throws Exception {
        UUID randomId = UUID.randomUUID();
        mockMvc.perform(get("/api/categories/" + randomId))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateCategoryNotFoundIntegration() throws Exception {
        UUID randomId = UUID.randomUUID();
        Category category = new Category();
        category.setName("Test");
        category.setDescription("Test");

        mockMvc.perform(put("/api/categories/" + randomId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(category)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteCategoryNotFoundIntegration() throws Exception {
        UUID randomId = UUID.randomUUID();
        mockMvc.perform(delete("/api/categories/" + randomId))
                .andExpect(status().isNotFound());
    }
}
