package io.dvloper.backend.controller;

import io.dvloper.backend.entities.Employee;
import io.dvloper.backend.repository.EmployeeRepository;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeRepository repository;

    public EmployeeController(EmployeeRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Employee> getAllEmployees() {
        return repository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable UUID id) {
        return repository.findById(id)
                .map(employee -> ResponseEntity.ok(employee))
                .orElse(ResponseEntity.notFound().build()); // 404 Not Found
    }

    @PostMapping
    public ResponseEntity<Employee> createEmployee(@Valid @RequestBody Employee employee) {
        // Check if an employee with the same ID already exists to prevent duplicates
        if (repository.existsById(employee.getId())) {
             return ResponseEntity.status(HttpStatus.CONFLICT).build(); // 409 Conflict
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(employee));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable UUID id, @Valid @RequestBody Employee employeeDetails) {
        return repository.findById(id)
                .map(employee -> {
                    employee.setEmail(employeeDetails.getEmail());
                    employee.setFullName(employeeDetails.getFullName());
                    employee.setDepartment(employeeDetails.getDepartment());
                    employee.setJob(employeeDetails.getJob());
                    return ResponseEntity.ok(repository.save(employee));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable UUID id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build(); // 204 No Content (success without body)
        }
        return ResponseEntity.notFound().build();
    }
}