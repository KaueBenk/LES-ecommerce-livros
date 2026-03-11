package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.service.AdminWorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/analise")
public class AnalyticsController {

    @Autowired
    private AdminWorkflowService adminWorkflowService;

    @GetMapping("/vendas")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnaliseVendas(
            @RequestParam String dataInicio,
            @RequestParam String dataFim,
            @RequestParam(required = false, defaultValue = "CATEGORIA") String agrupamento) {
        return ResponseEntity.ok(ApiResponse.success(
                adminWorkflowService.getAnaliseVendas(dataInicio, dataFim, agrupamento),
                "OK"
        ));
    }

    @GetMapping("/vendas-regiao")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnaliseVendasRegiao(
            @RequestParam String dataInicio,
            @RequestParam String dataFim) {
        return ResponseEntity.ok(ApiResponse.success(
                adminWorkflowService.getAnaliseVendasRegiao(dataInicio, dataFim),
                "OK"
        ));
    }
}
