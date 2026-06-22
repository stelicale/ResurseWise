package io.dvloper.backend;

import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import java.time.LocalDate;
import io.dvloper.backend.entities.Category;
import io.dvloper.backend.entities.Resource;
import io.dvloper.backend.entities.Log;
import io.dvloper.backend.repository.CategoryRepository;
import io.dvloper.backend.repository.LogRepository;
import io.dvloper.backend.repository.ResourceRepository;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    @Profile("!test")
    CommandLineRunner initDatabase(CategoryRepository categoryRepo,
            ResourceRepository resourceRepo,
            LogRepository logRepo) {
        return args -> {
            if (categoryRepo.count() == 0) {

                // UUID from Keycloak for admin user (this should match a real user in Keycloak)
                UUID adminKeycloakId = UUID.fromString("11111111-1111-1111-1111-111111111111");

                Category laptopCat = new Category("Laptops", "High performance computers");
                categoryRepo.save(laptopCat);

                Resource macbook = new Resource("MacBook Pro M3", "SN-999-888", "MacBook Pro M3 14-inch",
                        "Server Room A", LocalDate.of(2024, 1, 15), laptopCat);
                resourceRepo.save(macbook);

                Log log = new Log("ASSIGN", macbook, adminKeycloakId, "Initial assignment via Seeder");
                logRepo.save(log);
            }

            System.out.println("====================================================");
            System.out.println("[SUCCEEDED] Database seeded successfully with UUIDs!");
            System.out.println("====================================================");
        };
    }
}