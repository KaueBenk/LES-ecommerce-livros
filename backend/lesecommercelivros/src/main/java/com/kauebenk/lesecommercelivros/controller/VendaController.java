package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/vendas")
public class VendaController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping("/minhas")
    public ResponseEntity<ApiResponse<PaginatedResponse<Map<String, Object>>>> getMinhasVendas(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(clienteService.getTransacoes(pageable), "OK"));
    }
}
