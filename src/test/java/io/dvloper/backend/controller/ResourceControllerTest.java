package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Category;
import io.dvloper.backend.entities.Resource;
import io.dvloper.backend.repository.LogRepository;
import io.dvloper.backend.repository.ResourceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@WebMvcTest(value = ResourceController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {
        io.dvloper.backend.config.SecurityConfig.class }))
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ResourceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ResourceRepository repository;

    @MockBean
    private LogRepository logRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetAllResources() throws Exception {
        Resource res1 = createValidResource("MacBook Pro", "SN-001");
        Resource res2 = createValidResource("Dell XPS", "SN-002");

        when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(new PageImpl<>(Arrays.asList(res1, res2)));

        mockMvc.perform(get("/api/resources"))
                .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.content[0].name", is("MacBook Pro")))
            .andExpect(jsonPath("$.content[1].name", is("Dell XPS")));
    }

    @Test
    void testGetResourceById() throws Exception {
        UUID id = UUID.randomUUID();
        Resource resource = createValidResource("MacBook Pro", "SN-001");
        resource.setId(id);

        when(repository.findById(id)).thenReturn(Optional.of(resource));

        mockMvc.perform(get("/api/resources/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("MacBook Pro")))
                .andExpect(jsonPath("$.serialNumber", is("SN-001")));
    }

    @Test
    void testGetResourceByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();

        when(repository.findById(id)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/resources/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateResource() throws Exception {
        Resource resource = createValidResource("MacBook Pro", "SN-001");
        Resource savedResource = createValidResource("MacBook Pro", "SN-001");
        savedResource.setId(UUID.randomUUID());

        when(repository.save(any(Resource.class))).thenReturn(savedResource);

        mockMvc.perform(post("/api/resources")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resource)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("MacBook Pro")))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void testUpdateResource() throws Exception {
        UUID id = UUID.randomUUID();
        Resource existing = createValidResource("MacBook Pro", "SN-001");
        existing.setId(id);

        Resource updated = createValidResource("MacBook Pro M3", "SN-001");
        updated.setId(id);
        updated.setStatus("IN_USE");

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any(Resource.class))).thenReturn(updated);

        mockMvc.perform(put("/api/resources/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("MacBook Pro M3")))
                .andExpect(jsonPath("$.status", is("IN_USE")));
    }

    @Test
    void testUpdateResourceNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        Resource resource = createValidResource("MacBook Pro", "SN-001");

        when(repository.findById(id)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/resources/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resource)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteResource() throws Exception {
        UUID id = UUID.randomUUID();

        when(repository.existsById(id)).thenReturn(true);
        doNothing().when(repository).deleteById(id);

        mockMvc.perform(delete("/api/resources/{id}", id))
                .andExpect(status().isNoContent());

        verify(repository, times(1)).deleteById(id);
    }

    @Test
    void testDeleteResourceNotFound() throws Exception {
        UUID id = UUID.randomUUID();

        when(repository.existsById(id)).thenReturn(false);

        mockMvc.perform(delete("/api/resources/{id}", id))
                .andExpect(status().isNotFound());

        verify(repository, never()).deleteById(any());
    }

    @Test
    void testGetAllResourcesEmpty() throws Exception {
        when(repository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(new PageImpl<>(Arrays.asList()));

        mockMvc.perform(get("/api/resources"))
                .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    void testCreateResourceWithAllFields() throws Exception {
        Category category = new Category("Laptops", "High performance");

        Resource resource = createValidResource("MacBook Pro", "SN-001");
        resource.setCategory(category);
        resource.setLocation("Office A");
        resource.setPurchaseDate(LocalDate.of(2024, 1, 15));

        Resource savedResource = createValidResource("MacBook Pro", "SN-001");
        savedResource.setId(UUID.randomUUID());
        savedResource.setCategory(category);

        when(repository.save(any(Resource.class))).thenReturn(savedResource);

        mockMvc.perform(post("/api/resources")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resource)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("MacBook Pro")));
    }

    private Resource createValidResource(String name, String serialNumber) {
        Resource resource = new Resource();
        resource.setName(name);
        resource.setSerialNumber(serialNumber);
        resource.setModel("Model X");
        resource.setStatus("AVAILABLE");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("Warehouse");
        return resource;
    }
}
