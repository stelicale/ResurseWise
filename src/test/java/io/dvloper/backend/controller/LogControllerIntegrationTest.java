package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Log;
import io.dvloper.backend.repository.LogRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class LogControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LogRepository logRepository;

    @AfterEach
    void cleanup() {
        logRepository.deleteAll();
    }

    @Test
    void testGetLogsDefaultTimeAgo() throws Exception {
        Log log1 = new Log();
        log1.setActionType("CREATE");
        log1.setComments("Created category");
        log1.setActionDate(LocalDateTime.now().minusHours(1));
        logRepository.save(log1);

        Log log2 = new Log();
        log2.setActionType("UPDATE");
        log2.setComments("Updated resource");
        log2.setActionDate(LocalDateTime.now().minusHours(2));
        logRepository.save(log2);

        mockMvc.perform(get("/api/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    void testGetLogsWithTimeAgoHours() throws Exception {
        Log recentLog = new Log();
        recentLog.setActionType("CREATE");
        recentLog.setComments("Created category");
        recentLog.setActionDate(LocalDateTime.now().minusHours(1));
        logRepository.save(recentLog);

        Log oldLog = new Log();
        oldLog.setActionType("DELETE");
        oldLog.setComments("Deleted resource");
        oldLog.setActionDate(LocalDateTime.now().minusHours(5));
        logRepository.save(oldLog);

        mockMvc.perform(get("/api/logs").param("timeAgo", "2h"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].actionType", is("CREATE")));
    }

    @Test
    void testGetLogsWithTimeAgoDays() throws Exception {
        Log log = new Log();
        log.setActionType("CREATE");
        log.setComments("Created category");
        log.setActionDate(LocalDateTime.now().minusHours(12));
        logRepository.save(log);

        mockMvc.perform(get("/api/logs").param("timeAgo", "1d"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].actionType", is("CREATE")));
    }

    @Test
    void testGetLogsInvalidTimeFormat() throws Exception {
        mockMvc.perform(get("/api/logs").param("timeAgo", "invalid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetLogsInvalidTimeUnit() throws Exception {
        mockMvc.perform(get("/api/logs").param("timeAgo", "5m"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetLogsTooShortTime() throws Exception {
        mockMvc.perform(get("/api/logs").param("timeAgo", "0h"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetLogsTooLongTime() throws Exception {
        mockMvc.perform(get("/api/logs").param("timeAgo", "31d"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetLogsEmptyResult() throws Exception {
        Log oldLog = new Log();
        oldLog.setActionType("CREATE");
        oldLog.setComments("Created category");
        oldLog.setActionDate(LocalDateTime.now().minusDays(10));
        logRepository.save(oldLog);

        mockMvc.perform(get("/api/logs").param("timeAgo", "1h"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void testGetLogsMaxTime() throws Exception {
        Log log = new Log();
        log.setActionType("CREATE");
        log.setComments("Created category");
        log.setActionDate(LocalDateTime.now().minusDays(15));
        logRepository.save(log);

        mockMvc.perform(get("/api/logs").param("timeAgo", "30d"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void testGetLogsMinTime() throws Exception {
        Log log = new Log();
        log.setActionType("CREATE");
        log.setComments("Created category");
        log.setActionDate(LocalDateTime.now().minusMinutes(30));
        logRepository.save(log);

        mockMvc.perform(get("/api/logs").param("timeAgo", "1h"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }
}
