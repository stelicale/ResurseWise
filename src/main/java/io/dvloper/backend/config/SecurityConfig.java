package io.dvloper.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Opțional, pentru API-uri stateless
            .authorizeHttpRequests(auth -> auth
                // 1. RESOURCES Endpoint
                .requestMatchers(HttpMethod.GET, "/api/resources/**").hasAnyRole("Admin", "Employee")
                .requestMatchers(HttpMethod.POST, "/api/resources/**").hasRole("Admin")
                .requestMatchers(HttpMethod.PUT, "/api/resources/**").hasRole("Admin")
                .requestMatchers(HttpMethod.DELETE, "/api/resources/**").hasRole("Admin")

                // 2. CATEGORIES Endpoint
                .requestMatchers(HttpMethod.GET, "/api/categories/**").hasAnyRole("Admin", "Employee")
                .requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole("Admin")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("Admin")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("Admin")

                // 3. EMPLOYEES Endpoint (Doar Admin)
                .requestMatchers("/api/employees/**").hasRole("Admin")

                // 4. LOGS Endpoint (Doar Admin)
                .requestMatchers("/api/logs/**").hasRole("Admin")

                // Orice altceva cere autentificare
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );

        return http.build();
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        // Asta spune Spring Security: "Ignoră complet aceste rute, nici nu te uita la ele"
        return (web) -> web.ignoring().requestMatchers(
            "/v3/api-docs/**", 
            "/swagger-ui/**", 
            "/swagger-ui.html"
        );
    }

    // Convertor pentru a extrage rolurile din Keycloak (realm_access)
    @Bean
    public Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
                Map<String, Object> realmAccess = jwt.getClaim("realm_access");
                if (realmAccess == null || realmAccess.isEmpty()) {
                    return new java.util.ArrayList<>();
                }
                
            Collection<String> roles = (Collection<String>) realmAccess.get("roles");
            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
        });
        return converter;
    }
}