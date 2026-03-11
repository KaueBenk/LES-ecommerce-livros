package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatClient chatClient;

    public ChatController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(@RequestBody Map<String, String> request) {
        String mensagem = request.get("mensagem");
        String sessionId = request.getOrDefault("sessionId", "default-session");
        
        String aiResponse = "";
        try {
            aiResponse = chatClient.prompt()
                .user(mensagem)
                .system("Você é um assistente de recomendação de livros para um e-commerce. Seja educado e conciso.")
                .call()
                .content();
        } catch (Exception e) {
            aiResponse = "Desculpe, estou com problemas técnicos no momento. Recomendo 'Clean Code' para começar!";
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("resposta", aiResponse);
        responseData.put("sessionId", sessionId);
        responseData.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(ApiResponse.success(responseData, "OK"));
    }
}
