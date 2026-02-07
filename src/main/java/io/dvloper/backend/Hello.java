package io.dvloper.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Hello {

	@GetMapping("/")
    public String sayHello() {
        return "Hello World from Spring Boot!\n";
    }
}
