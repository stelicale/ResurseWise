package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Category;
import io.dvloper.backend.entities.Resource;
import io.dvloper.backend.repository.CategoryRepository;
import io.dvloper.backend.repository.ResourceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ResourceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Category testCategory;

    @BeforeEach
    void setup() {
        testCategory = new Category();
        testCategory.setName("Test Category");
        testCategory.setDescription("Test Description");
        testCategory = categoryRepository.save(testCategory);
    }

    @AfterEach
    void cleanup() {
        resourceRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    @Test
    void testGetAllResourcesIntegration() throws Exception {
        Resource resource1 = new Resource();
        resource1.setName("Resource 1");
        resource1.setSerialNumber("SN-001");
        resource1.setModel("Model 1");
        resource1.setStatus("AVAILABLE");
        resource1.setLocation("Office A");
        resource1.setCategory(testCategory);
        resource1.setPurchaseDate(LocalDate.now());
        resourceRepository.save(resource1);

        Resource resource2 = new Resource();
        resource2.setName("Resource 2");
        resource2.setSerialNumber("SN-002");
        resource2.setModel("Model 2");
        resource2.setStatus("IN_USE");
        resource2.setLocation("Office B");
        resource2.setCategory(testCategory);
        resource2.setPurchaseDate(LocalDate.now());
        resourceRepository.save(resource2);

        mockMvc.perform(get("/api/resources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Resource 1")))
                .andExpect(jsonPath("$[1].name", is("Resource 2")));
    }

    @Test
    void testGetResourceByIdIntegration() throws Exception {
        Resource resource = new Resource();
        resource.setName("Test Resource");
        resource.setSerialNumber("SN-TEST");
        resource.setModel("Test Model");
        resource.setStatus("AVAILABLE");
        resource.setLocation("Test Location");
        resource.setCategory(testCategory);
        resource.setPurchaseDate(LocalDate.now());
        Resource saved = resourceRepository.save(resource);

        mockMvc.perform(get("/api/resources/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Test Resource")))
                .andExpect(jsonPath("$.model", is("Test Model")))
                .andExpect(jsonPath("$.serialNumber", is("SN-TEST")));
    }

    @Test
    void testCreateResourceIntegration() throws Exception {
        Resource resource = new Resource();
        resource.setName("New Resource");
        resource.setSerialNumber("SN-NEW");
        resource.setModel("New Model");
        resource.setStatus("AVAILABLE");
        resource.setLocation("New Location");
        resource.setCategory(testCategory);
        resource.setPurchaseDate(LocalDate.now());

        mockMvc.perform(post("/api/resources")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resource)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("New Resource")))
                .andExpect(jsonPath("$.model", is("New Model")))
                .andExpect(jsonPath("$.serialNumber", is("SN-NEW")));
    }

    @Test
    void testUpdateResourceIntegration() throws Exception {
        Resource resource = new Resource();
        resource.setName("Original Resource");
        resource.setSerialNumber("SN-ORIG");
        resource.setModel("Original Model");
        resource.setStatus("AVAILABLE");
        resource.setLocation("Original Location");
        resource.setCategory(testCategory);
        resource.setPurchaseDate(LocalDate.now());
        Resource saved = resourceRepository.save(resource);

        saved.setName("Updated Resource");
        saved.setModel("Updated Model");
        saved.setStatus("IN_USE");

        mockMvc.perform(put("/api/resources/" + saved.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(saved)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Resource")))
                .andExpect(jsonPath("$.model", is("Updated Model")))
                .andExpect(jsonPath("$.status", is("IN_USE")));
    }

    @Test
    void testDeleteResourceIntegration() throws Exception {
        Resource resource = new Resource();
        resource.setName("To Delete");
        resource.setSerialNumber("SN-DEL");
        resource.setModel("To Delete Model");
        resource.setStatus("AVAILABLE");
        resource.setLocation("To Delete Location");
        resource.setCategory(testCategory);
        resource.setPurchaseDate(LocalDate.now());
        Resource saved = resourceRepository.save(resource);

        mockMvc.perform(delete("/api/resources/" + saved.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/resources/" + saved.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    void testGetResourceByIdNotFoundIntegration() throws Exception {
        UUID randomId = UUID.randomUUID();
        mockMvc.perform(get("/api/resources/" + randomId))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateResourceNotFoundIntegration() throws Exception {
        UUID randomId = UUID.randomUUID();
        Resource resource = new Resource();
        resource.setName("Test");
        resource.setSerialNumber("SN-TEST");
        resource.setModel("Test Model");
        resource.setStatus("AVAILABLE");
        resource.setLocation("Test Location");
        resource.setCategory(testCategory);
        resource.setPurchaseDate(LocalDate.now());

        mockMvc.perform(put("/api/resources/" + randomId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resource)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteResourceNotFoundIntegration() throws Exception {
        UUID randomId = UUID.randomUUID();
        mockMvc.perform(delete("/api/resources/" + randomId))
                .andExpect(status().isNotFound());
    }
}
