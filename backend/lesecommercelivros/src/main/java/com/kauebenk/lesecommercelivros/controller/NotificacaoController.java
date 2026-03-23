package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.service.NotificacaoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/notificacoes")
public class NotificacaoController {

    @Autowired
    private NotificacaoService notificacaoService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<Map<String, Object>>>> listar(
            @RequestParam(required = false) Boolean lida,
            Pageable pageable
    ) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth != null ? auth.getName() : "ANÔNIMO";
            log.info("[NOTIF-CTRL] GET /api/v1/notificacoes - Email: {}, Lida: {}, Page: {}", email, lida, pageable.getPageNumber());
            PaginatedResponse<Map<String, Object>> result = notificacaoService.listar(pageable, lida);
            return ResponseEntity.ok(ApiResponse.success(result, "OK"));
        } catch (Exception e) {
            log.error("[NOTIF-CTRL] Erro ao listar notificações", e);
            throw e;
        }
    }

    @GetMapping("/nao-lidas/count")
    public ResponseEntity<ApiResponse<Long>> countNaoLidas() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth != null ? auth.getName() : "ANÔNIMO";
            log.info("[NOTIF-CTRL] GET /api/v1/notificacoes/nao-lidas/count - Email: {}", email);
            long count = notificacaoService.contarNaoLidas();
            log.debug("[NOTIF-CTRL] Notificações não lidas: {}", count);
            return ResponseEntity.ok(ApiResponse.success(count, "OK"));
        } catch (Exception e) {
            log.error("[NOTIF-CTRL] Erro ao contar notificações não lidas", e);
            throw e;
        }
    }

    @PatchMapping("/{id}/lida")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> marcarComoLida(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth != null ? auth.getName() : "ANÔNIMO";
            log.info("[NOTIF-CTRL] PATCH /api/v1/notificacoes/{}/lida - Email: {}", id, email);
            notificacaoService.marcarComoLida(id);
            log.info("[NOTIF-CTRL] Notificação marcada como lida - ID: {}, Email: {}", id, email);
            return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Notificação marcada como lida"));
        } catch (Exception e) {
            log.error("[NOTIF-CTRL] Erro ao marcar notificação como lida - ID: {}", id, e);
            throw e;
        }
    }
}
