package io.dvloper.backend.repository;

import io.dvloper.backend.entities.Category;
import io.dvloper.backend.entities.Resource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class ResourceRepositoryTest {

    @Autowired
    private ResourceRepository repository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Category testCategory;

    @BeforeEach
    void setUp() {
        testCategory = new Category("Laptops", "High performance computers");
        testCategory = categoryRepository.save(testCategory);
    }

    @Test
    void testSaveResource() {
        Resource resource = createValidResource("MacBook Pro", "SN-001");
        Resource saved = repository.save(resource);

        assertNotNull(saved.getId());
        assertEquals("MacBook Pro", saved.getName());
        assertEquals("SN-001", saved.getSerialNumber());
    }

    @Test
    void testFindById() {
        Resource resource = createValidResource("MacBook Pro", "SN-001");
        Resource saved = repository.save(resource);

        Optional<Resource> found = repository.findById(saved.getId());

        assertTrue(found.isPresent());
        assertEquals("MacBook Pro", found.get().getName());
    }

    @Test
    void testFindByIdNotFound() {
        UUID randomId = UUID.randomUUID();
        Optional<Resource> found = repository.findById(randomId);

        assertFalse(found.isPresent());
    }

    @Test
    void testFindAll() {
        Resource resource1 = createValidResource("MacBook Pro", "SN-001");
        Resource resource2 = createValidResource("Dell XPS", "SN-002");

        repository.save(resource1);
        repository.save(resource2);

        List<Resource> resources = repository.findAll();

        assertTrue(resources.size() >= 2);
    }

    @Test
    void testUpdateResource() {
        Resource resource = createValidResource("MacBook Pro", "SN-001");
        Resource saved = repository.save(resource);

        saved.setName("MacBook Pro M3");
        saved.setStatus("IN_USE");
        Resource updated = repository.save(saved);

        assertEquals("MacBook Pro M3", updated.getName());
        assertEquals("IN_USE", updated.getStatus());
    }

    @Test
    void testDeleteResource() {
        Resource resource = createValidResource("MacBook Pro", "SN-001");
        Resource saved = repository.save(resource);
        UUID id = saved.getId();

        repository.deleteById(id);

        Optional<Resource> found = repository.findById(id);
        assertFalse(found.isPresent());
    }

    @Test
    void testExistsById() {
        Resource resource = createValidResource("MacBook Pro", "SN-001");
        Resource saved = repository.save(resource);

        boolean exists = repository.existsById(saved.getId());
        assertTrue(exists);

        boolean notExists = repository.existsById(UUID.randomUUID());
        assertFalse(notExists);
    }

    @Test
    void testCount() {
        long initialCount = repository.count();

        Resource resource1 = createValidResource("MacBook Pro", "SN-001");
        Resource resource2 = createValidResource("Dell XPS", "SN-002");

        repository.save(resource1);
        repository.save(resource2);

        long newCount = repository.count();
        assertEquals(initialCount + 2, newCount);
    }

    @Test
    void testResourceWithCategory() {
        Resource resource = createValidResource("MacBook Pro", "SN-001");
        Resource saved = repository.save(resource);

        assertNotNull(saved.getCategory());
        assertEquals("Laptops", saved.getCategory().getName());
    }

    @Test
    void testResourceFieldPersistence() {
        Resource resource = createValidResource("MacBook Pro", "SN-001");
        resource.setLocation("Office A");
        resource.setPurchaseDate(LocalDate.of(2024, 1, 15));

        Resource saved = repository.save(resource);

        assertEquals("Office A", saved.getLocation());
        assertEquals(LocalDate.of(2024, 1, 15), saved.getPurchaseDate());
    }

    private Resource createValidResource(String name, String serialNumber) {
        Resource resource = new Resource();
        resource.setName(name);
        resource.setSerialNumber(serialNumber);
        resource.setModel("Model X");
        resource.setStatus("AVAILABLE");
        resource.setPurchaseDate(LocalDate.now());
        resource.setLocation("Warehouse");
        resource.setCategory(testCategory);
        return resource;
    }
}
