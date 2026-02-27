package io.dvloper.backend.repository;

import io.dvloper.backend.entities.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ResourceRepository extends JpaRepository<Resource, UUID> {
}