package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.service.NotificacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

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
        return ResponseEntity.ok(ApiResponse.success(notificacaoService.listar(pageable, lida), "OK"));
    }

    @GetMapping("/nao-lidas/count")
    public ResponseEntity<ApiResponse<Long>> countNaoLidas() {
        return ResponseEntity.ok(ApiResponse.success(notificacaoService.contarNaoLidas(), "OK"));
    }

    @PatchMapping("/{id}/lida")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> marcarComoLida(@PathVariable Long id) {
        notificacaoService.marcarComoLida(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Notificação marcada como lida"));
    }
}
