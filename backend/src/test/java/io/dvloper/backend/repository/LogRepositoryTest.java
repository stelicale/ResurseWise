package io.dvloper.backend.repository;

import io.dvloper.backend.entities.Category;
import io.dvloper.backend.entities.Log;
import io.dvloper.backend.entities.Resource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class LogRepositoryTest {

    @Autowired
    private LogRepository repository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Resource testResource;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        Category category = new Category("Laptops", "Test category");
        category = categoryRepository.save(category);

        testResource = new Resource();
        testResource.setName("MacBook Pro");
        testResource.setSerialNumber("SN-001");
        testResource.setModel("M3");
        testResource.setStatus("AVAILABLE");
        testResource.setPurchaseDate(LocalDate.now());
        testResource.setLocation("Office");
        testResource.setCategory(category);
        testResource = resourceRepository.save(testResource);

        testUserId = UUID.randomUUID();
    }

    @Test
    void testSaveLog() {
        Log log = createValidLog("ASSIGN", "Assigned to user");
        Log saved = repository.save(log);

        assertNotNull(saved.getId());
        assertEquals("ASSIGN", saved.getActionType());
        assertEquals("Assigned to user", saved.getComments());
    }

    @Test
    void testFindById() {
        Log log = createValidLog("ASSIGN", "Assigned to user");
        Log saved = repository.save(log);

        Optional<Log> found = repository.findById(saved.getId());

        assertTrue(found.isPresent());
        assertEquals("ASSIGN", found.get().getActionType());
    }

    @Test
    void testFindByIdNotFound() {
        UUID randomId = UUID.randomUUID();
        Optional<Log> found = repository.findById(randomId);

        assertFalse(found.isPresent());
    }

    @Test
    void testFindAll() {
        Log log1 = createValidLog("ASSIGN", "Assigned to user");
        Log log2 = createValidLog("UNASSIGN", "Returned by user");

        repository.save(log1);
        repository.save(log2);

        List<Log> logs = repository.findAll();

        assertTrue(logs.size() >= 2);
    }

    @Test
    void testFindLogsSince() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime past = now.minusHours(2);

        Log oldLog = createValidLog("ASSIGN", "Old log");
        oldLog.setActionDate(past);
        repository.save(oldLog);

        Log newLog = createValidLog("UNASSIGN", "New log");
        newLog.setActionDate(now);
        repository.save(newLog);

        List<Log> recentLogs = repository.findLogsSince(now.minusHours(1));

        assertTrue(recentLogs.stream().anyMatch(l -> l.getComments().equals("New log")));
        assertFalse(recentLogs.stream().anyMatch(l -> l.getComments().equals("Old log")));
    }

    @Test
    void testFindLogsSinceOrderedDescending() {
        LocalDateTime now = LocalDateTime.now();

        Log log1 = createValidLog("ASSIGN", "First log");
        log1.setActionDate(now.minusHours(3));
        repository.save(log1);

        Log log2 = createValidLog("REPAIR", "Second log");
        log2.setActionDate(now.minusHours(2));
        repository.save(log2);

        Log log3 = createValidLog("UNASSIGN", "Third log");
        log3.setActionDate(now.minusHours(1));
        repository.save(log3);

        List<Log> logs = repository.findLogsSince(now.minusHours(4));

        assertTrue(logs.size() >= 3);
        // Should be ordered by actionDate DESC
        assertTrue(logs.get(0).getActionDate().isAfter(logs.get(logs.size() - 1).getActionDate())
                || logs.get(0).getActionDate().equals(logs.get(logs.size() - 1).getActionDate()));
    }

    @Test
    void testDeleteLog() {
        Log log = createValidLog("ASSIGN", "Assigned to user");
        Log saved = repository.save(log);
        UUID id = saved.getId();

        repository.deleteById(id);

        Optional<Log> found = repository.findById(id);
        assertFalse(found.isPresent());
    }

    @Test
    void testExistsById() {
        Log log = createValidLog("ASSIGN", "Assigned to user");
        Log saved = repository.save(log);

        boolean exists = repository.existsById(saved.getId());
        assertTrue(exists);

        boolean notExists = repository.existsById(UUID.randomUUID());
        assertFalse(notExists);
    }

    @Test
    void testCount() {
        long initialCount = repository.count();

        Log log1 = createValidLog("ASSIGN", "Log 1");
        Log log2 = createValidLog("UNASSIGN", "Log 2");

        repository.save(log1);
        repository.save(log2);

        long newCount = repository.count();
        assertEquals(initialCount + 2, newCount);
    }

    @Test
    void testLogWithResource() {
        Log log = createValidLog("ASSIGN", "Assigned to user");
        Log saved = repository.save(log);

        assertNotNull(saved.getResource());
        assertEquals("MacBook Pro", saved.getResource().getName());
    }

    @Test
    void testLogFieldPersistence() {
        Log log = createValidLog("ASSIGN", "Test comment");
        log.setCreatedByKeycloakId(testUserId);

        Log saved = repository.save(log);

        assertEquals(testUserId, saved.getCreatedByKeycloakId());
        assertNotNull(saved.getActionDate());
    }

    private Log createValidLog(String actionType, String comments) {
        Log log = new Log();
        log.setActionType(actionType);
        log.setActionDate(LocalDateTime.now());
        log.setComments(comments);
        log.setResource(testResource);
        log.setCreatedByKeycloakId(testUserId);
        return log;
    }
}
