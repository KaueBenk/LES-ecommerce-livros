package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import com.kauebenk.lesecommercelivros.service.ChatRecommendationService;
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

    private final ChatRecommendationService chatRecommendationService;

    public ChatController(ChatRecommendationService chatRecommendationService) {
        this.chatRecommendationService = chatRecommendationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(@RequestBody Map<String, String> request) {
        try {
            String mensagem = request.get("mensagem");
            String sessionId = request.getOrDefault("sessionId", "");
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth != null ? auth.getName() : "ANÔNIMO";
            
            log.info("[CHAT-CTRL] POST /api/v1/chat - SessionID: {}, Email: {}", sessionId, email);
            
            if (mensagem == null || mensagem.trim().isEmpty()) {
                mensagem = "";
            }

            ChatRecommendationService.ChatResponse chatResponse = chatRecommendationService
                    .buildResponse(mensagem, sessionId, auth);

            String aiResponse = chatResponse.resposta;
            sessionId = chatResponse.sessionId;
            LocalDateTime timestamp = chatResponse.timestamp;

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("resposta", aiResponse);
            responseData.put("sessionId", sessionId);
            responseData.put("timestamp", timestamp);

            log.debug("[CHAT-CTRL] Chat concluído - SessionID: {}, Email: {}", sessionId, email);
            return ResponseEntity.ok(ApiResponse.success(responseData, "OK"));
        } catch (Exception e) {
            log.error("[CHAT-CTRL] Erro ao processar chat", e);
            throw e;
        }
    }
}
