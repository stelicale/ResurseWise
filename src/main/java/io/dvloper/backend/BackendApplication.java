package io.dvloper.backend;

import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import io.dvloper.backend.entities.Employee;
import io.dvloper.backend.entities.Category;
import io.dvloper.backend.entities.Resource;
import io.dvloper.backend.entities.Log;
import io.dvloper.backend.repository.CategoryRepository;
import io.dvloper.backend.repository.EmployeeRepository;
import io.dvloper.backend.repository.LogRepository;
import io.dvloper.backend.repository.ResourceRepository;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

    @Bean
    CommandLineRunner initDatabase(EmployeeRepository employeeRepo,
                                   CategoryRepository categoryRepo,
                                   ResourceRepository resourceRepo,
                                   LogRepository logRepo) {
        return args -> {
            if (employeeRepo.count() == 0) {
                
                UUID adminUuid = UUID.fromString("11111111-1111-1111-1111-111111111111");
                Employee admin = new Employee(
                        adminUuid,
                        "admin@dvloper.io",
                        "System Admin",
                        "IT",
                        "Administrator"
                );
                employeeRepo.save(admin);

                Category laptopCat = new Category("Laptops", "High performance computers");
                categoryRepo.save(laptopCat);

                Resource macbook = new Resource("MacBook Pro M3", "SN-999-888", laptopCat);
                macbook.setEmployee(admin);
                resourceRepo.save(macbook);

                Log log = new Log("ASSIGN", macbook, admin, "Initial assignment via Seeder");
                logRepo.save(log);

                System.out.println("[SUCCEEDED] Database seeded successfully with UUIDs!");
            }
        };
    }
}
