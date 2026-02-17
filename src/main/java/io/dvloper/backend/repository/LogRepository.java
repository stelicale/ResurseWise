package io.dvloper.backend.repository;

import io.dvloper.backend.entities.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface LogRepository extends JpaRepository<Log, UUID> {

    /**
     * Find logs created after a specific date/time
     */
    @Query("SELECT l FROM Log l WHERE l.actionDate >= :fromDate ORDER BY l.actionDate DESC")
    List<Log> findLogsSince(@Param("fromDate") LocalDateTime fromDate);
}