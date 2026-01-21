package io.dvloper.backend.repository;

import io.dvloper.backend.entities.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface LogRepository extends JpaRepository<Log, UUID> {}