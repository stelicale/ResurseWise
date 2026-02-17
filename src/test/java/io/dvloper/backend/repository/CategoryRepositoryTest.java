package io.dvloper.backend.repository;

import io.dvloper.backend.entities.Category;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class CategoryRepositoryTest {

    @Autowired
    private CategoryRepository repository;

    @Test
    void testSaveCategory() {
        Category category = new Category("Laptops", "High performance computers");
        Category saved = repository.save(category);

        assertNotNull(saved.getId());
        assertEquals("Laptops", saved.getName());
        assertEquals("High performance computers", saved.getDescription());
    }

    @Test
    void testFindById() {
        Category category = new Category("Laptops", "High performance computers");
        Category saved = repository.save(category);

        Optional<Category> found = repository.findById(saved.getId());

        assertTrue(found.isPresent());
        assertEquals("Laptops", found.get().getName());
    }

    @Test
    void testFindByIdNotFound() {
        UUID randomId = UUID.randomUUID();
        Optional<Category> found = repository.findById(randomId);

        assertFalse(found.isPresent());
    }

    @Test
    void testFindAll() {
        Category category1 = new Category("Laptops", "High performance computers");
        Category category2 = new Category("Monitors", "Display devices");

        repository.save(category1);
        repository.save(category2);

        List<Category> categories = repository.findAll();

        assertTrue(categories.size() >= 2);
    }

    @Test
    void testUpdateCategory() {
        Category category = new Category("Laptops", "High performance computers");
        Category saved = repository.save(category);

        saved.setName("Gaming Laptops");
        saved.setDescription("High-end gaming computers");
        Category updated = repository.save(saved);

        assertEquals("Gaming Laptops", updated.getName());
        assertEquals("High-end gaming computers", updated.getDescription());
    }

    @Test
    void testDeleteCategory() {
        Category category = new Category("Laptops", "High performance computers");
        Category saved = repository.save(category);
        UUID id = saved.getId();

        repository.deleteById(id);

        Optional<Category> found = repository.findById(id);
        assertFalse(found.isPresent());
    }

    @Test
    void testExistsById() {
        Category category = new Category("Laptops", "High performance computers");
        Category saved = repository.save(category);

        boolean exists = repository.existsById(saved.getId());
        assertTrue(exists);

        boolean notExists = repository.existsById(UUID.randomUUID());
        assertFalse(notExists);
    }

    @Test
    void testCount() {
        long initialCount = repository.count();

        Category category1 = new Category("Laptops", "High performance computers");
        Category category2 = new Category("Monitors", "Display devices");

        repository.save(category1);
        repository.save(category2);

        long newCount = repository.count();
        assertEquals(initialCount + 2, newCount);
    }

    @Test
    void testDeleteAll() {
        Category category1 = new Category("Laptops", "High performance computers");
        Category category2 = new Category("Monitors", "Display devices");

        repository.save(category1);
        repository.save(category2);

        repository.deleteAll();

        assertEquals(0, repository.count());
    }

    @Test
    void testSaveAndFlush() {
        Category category = new Category("Laptops", "High performance computers");
        Category saved = repository.saveAndFlush(category);

        assertNotNull(saved.getId());
        assertEquals("Laptops", saved.getName());
    }
}
