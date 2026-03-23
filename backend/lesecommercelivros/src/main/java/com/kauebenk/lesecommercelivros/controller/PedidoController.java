package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.service.PedidoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/pedidos")
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @PostMapping("/{id}/trocas")
    public ResponseEntity<ApiResponse<Map<String, Object>>> solicitarTroca(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload
    ) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth != null ? auth.getName() : "ANÔNIMO";
            log.info("[PEDIDO-CTRL] POST /api/v1/pedidos/{}/trocas - Email: {}", id, email);
            Map<String, Object> resultado = pedidoService.solicitarTroca(id, payload);
            log.info("[PEDIDO-CTRL] Troca solicitada com sucesso - PedidoID: {}, Email: {}", id, email);
            return ResponseEntity
                    .status(201)
                    .body(ApiResponse.created(resultado, "Solicitação de troca enviada"));
        } catch (Exception e) {
            log.error("[PEDIDO-CTRL] Erro ao solicitar troca - PedidoID: {}", id, e);
            throw e;
        }
    }
}
