package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.service.ClienteService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/vendas")
public class VendaController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping("/minhas")
    public ResponseEntity<ApiResponse<PaginatedResponse<Map<String, Object>>>> getMinhasVendas(Pageable pageable) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth != null ? auth.getName() : "ANÔNIMO";
            log.info("[VENDA-CTRL] GET /api/v1/vendas/minhas - Email: {}, Page: {}", email, pageable.getPageNumber());
            PaginatedResponse<Map<String, Object>> vendas = clienteService.getTransacoes(pageable);
            log.debug("[VENDA-CTRL] Vendas encontradas: {}", vendas.getTotalElements());
            return ResponseEntity.ok(ApiResponse.success(vendas, "OK"));
        } catch (Exception e) {
            log.error("[VENDA-CTRL] Erro ao obter minhas vendas", e);
            throw e;
        }
    }
}
