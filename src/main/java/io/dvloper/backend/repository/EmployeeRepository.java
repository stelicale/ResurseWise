package io.dvloper.backend.repository;

import io.dvloper.backend.entities.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    Optional<Employee> findByKeycloakId(String keycloakId);
}