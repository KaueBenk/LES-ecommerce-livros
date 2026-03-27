package com.kauebenk.lesecommercelivros.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Handler global de exceções para centralizar logging e resposta de erros.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Trata ResponseStatusException lançadas pela aplicação.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(
            ResponseStatusException ex,
            WebRequest request) {
        
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        String message = ex.getReason() != null ? ex.getReason() : "Erro na requisição";
        String path = request.getDescription(false).replace("uri=", "");
        
        // Log baseado no status code
        if (status.is5xxServerError()) {
            log.error("[ERRO-SERVIDOR] {} {} - Status: {} - Mensagem: {}", 
                    request.getContextPath(), path, status.value(), message, ex);
        } else if (status.is4xxClientError()) {
            log.warn("[ERRO-CLIENTE] {} {} - Status: {} - Mensagem: {}", 
                    request.getContextPath(), path, status.value(), message);
        }
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", path);
        
        return new ResponseEntity<>(body, status);
    }

    /**
     * Trata exceções genéricas não capturadas.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex,
            WebRequest request) {
        
        String path = request.getDescription(false).replace("uri=", "");
        
        log.error("[ERRO-INTERNO] {} {} - Exceção não tratada: {}", 
                request.getContextPath(), path, ex.getMessage(), ex);
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Internal Server Error");
        body.put("message", "Erro interno do servidor. Contate o suporte.");
        body.put("path", path);
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Trata IllegalArgumentException.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(
            IllegalArgumentException ex,
            WebRequest request) {
        
        String path = request.getDescription(false).replace("uri=", "");
        
        log.warn("[ARGUMENTO-INVALIDO] {} {} - {}", 
                request.getContextPath(), path, ex.getMessage());
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Bad Request");
        body.put("message", ex.getMessage());
        body.put("path", path);
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Trata NullPointerException.
     */
    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Map<String, Object>> handleNullPointerException(
            NullPointerException ex,
            WebRequest request) {
        
        String path = request.getDescription(false).replace("uri=", "");
        
        log.error("[NULL-POINTER] {} {} - Erro de referência nula", 
                request.getContextPath(), path, ex);
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Internal Server Error");
        body.put("message", "Erro interno: referência nula não esperada");
        body.put("path", path);
        
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
