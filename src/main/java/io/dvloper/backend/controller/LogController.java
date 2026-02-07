package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Log;
import io.dvloper.backend.repository.LogRepository;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/logs")
public class LogController {
    private final LogRepository repository;

    public LogController(LogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Log> getAllLogs() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Log> getLogById(@PathVariable UUID id) {
        return repository.findById(id)
                .map(log -> ResponseEntity.ok(log))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Log> createLog(@Valid @RequestBody Log log) {
        Log savedLog = repository.save(log);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedLog);
    }
}