package io.dvloper.backend.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Arrays;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void testHandleValidationErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);

        FieldError error1 = new FieldError("category", "name", "Name cannot be empty");
        FieldError error2 = new FieldError("category", "description", "Description cannot be empty");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(Arrays.asList(error1, error2));

        ResponseEntity<Map<String, String>> response = handler.handleValidationErrors(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        assertEquals("Name cannot be empty", response.getBody().get("name"));
        assertEquals("Description cannot be empty", response.getBody().get("description"));
    }

    @Test
    void testHandleValidationErrorsEmpty() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(Arrays.asList());

        ResponseEntity<Map<String, String>> response = handler.handleValidationErrors(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void testHandleDuplicateEntry() {
        DuplicateEntryException ex = new DuplicateEntryException("Category already exists");

        ResponseEntity<Map<String, String>> response = handler.handleDuplicateEntry(ex, null);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Category already exists", response.getBody().get("message"));
    }

    @Test
    void testHandleValidationErrorsSingleField() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);

        FieldError error = new FieldError("category", "name", "Name must be between 3 and 50 characters");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(Arrays.asList(error));

        ResponseEntity<Map<String, String>> response = handler.handleValidationErrors(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals("Name must be between 3 and 50 characters", response.getBody().get("name"));
    }

    @Test
    void testHandleGeneralErrors() {
        Exception ex = new RuntimeException("Something went wrong");

        ResponseEntity<Map<String, String>> response = handler.handleGeneralErrors(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("An unexpected error occurred", response.getBody().get("error"));
        assertEquals("Something went wrong", response.getBody().get("details"));
    }

    @Test
    void testHandleGeneralErrorsNullMessage() {
        Exception ex = new RuntimeException();

        ResponseEntity<Map<String, String>> response = handler.handleGeneralErrors(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("An unexpected error occurred", response.getBody().get("error"));
    }

    @Test
    void testHandleGeneralErrorsDifferentExceptionTypes() {
        Exception[] exceptions = {
                new IllegalArgumentException("Invalid argument"),
                new NullPointerException("Null pointer"),
                new UnsupportedOperationException("Unsupported operation")
        };

        for (Exception ex : exceptions) {
            ResponseEntity<Map<String, String>> response = handler.handleGeneralErrors(ex);

            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals("An unexpected error occurred", response.getBody().get("error"));
            assertEquals(ex.getMessage(), response.getBody().get("details"));
        }
    }

    @Test
    void testHandleValidationErrorsMultipleFieldsSameName() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);

        // Simulate multiple errors on the same field (last one should win)
        FieldError error1 = new FieldError("category", "name", "First error");
        FieldError error2 = new FieldError("category", "name", "Second error");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(Arrays.asList(error1, error2));

        ResponseEntity<Map<String, String>> response = handler.handleValidationErrors(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        // Last error should overwrite the first
        assertEquals("Second error", response.getBody().get("name"));
    }

    @Test
    void testResponseBodyIsNotNull() {
        Exception ex = new RuntimeException("Test");
        ResponseEntity<Map<String, String>> response = handler.handleGeneralErrors(ex);

        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("error"));
        assertTrue(response.getBody().containsKey("details"));
    }
}
