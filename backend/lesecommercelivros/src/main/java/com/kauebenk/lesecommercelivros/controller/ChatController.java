package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatClient chatClient;

    public ChatController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(@RequestBody Map<String, String> request) {
        try {
            String mensagem = request.get("mensagem");
            String sessionId = request.getOrDefault("sessionId", "default-session");
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth != null ? auth.getName() : "ANÔNIMO";
            
            log.info("[CHAT-CTRL] POST /api/v1/chat - SessionID: {}, Email: {}", sessionId, email);
            
            String aiResponse = "";
            try {
                log.debug("[CHAT-CTRL] Enviando mensagem para IA - SessionID: {}", sessionId);
                aiResponse = chatClient.prompt()
                    .user(mensagem)
                    .system("Você é um assistente de recomendação de livros para um e-commerce. Seja educado e conciso.")
                    .call()
                    .content();
                log.info("[CHAT-CTRL] Resposta IA obtida - SessionID: {}", sessionId);
            } catch (Exception e) {
                log.error("[CHAT-CTRL] Erro ao obter resposta da IA - SessionID: {}", sessionId, e);
                aiResponse = "Desculpe, estou com problemas técnicos no momento. Recomendo 'Clean Code' para começar!";
            }

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("resposta", aiResponse);
            responseData.put("sessionId", sessionId);
            responseData.put("timestamp", LocalDateTime.now());

            log.debug("[CHAT-CTRL] Chat concluído - SessionID: {}, Email: {}", sessionId, email);
            return ResponseEntity.ok(ApiResponse.success(responseData, "OK"));
        } catch (Exception e) {
            log.error("[CHAT-CTRL] Erro ao processar chat", e);
            throw e;
        }
    }
}
