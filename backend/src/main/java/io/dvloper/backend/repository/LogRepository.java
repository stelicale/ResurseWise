package io.dvloper.backend.repository;

import io.dvloper.backend.entities.Log;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface LogRepository extends JpaRepository<Log, UUID>, JpaSpecificationExecutor<Log> {

    /**
     * Find logs created after a specific date/time
     */
    @Query("SELECT l FROM Log l WHERE l.actionDate >= :fromDate ORDER BY l.actionDate DESC")
    List<Log> findLogsSince(@Param("fromDate") LocalDateTime fromDate);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Log l SET l.resource = null WHERE l.resource.id = :resourceId")
    int detachResourceReferences(@Param("resourceId") UUID resourceId);
}