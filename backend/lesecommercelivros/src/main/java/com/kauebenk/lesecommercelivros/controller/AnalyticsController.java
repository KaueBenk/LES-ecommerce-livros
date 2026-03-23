package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.service.AdminWorkflowService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
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
        try {
            log.info("[ANALYTICS-CTRL] GET /api/v1/admin/analise/vendas - DataInicio: {}, DataFim: {}, Agrupamento: {}", 
                    dataInicio, dataFim, agrupamento);
            Map<String, Object> result = adminWorkflowService.getAnaliseVendas(dataInicio, dataFim, agrupamento);
            log.info("[ANALYTICS-CTRL] Análise de vendas obtida com sucesso");
            return ResponseEntity.ok(ApiResponse.success(result, "OK"));
        } catch (Exception e) {
            log.error("[ANALYTICS-CTRL] Erro ao obter análise de vendas", e);
            throw e;
        }
    }

    @GetMapping("/vendas-regiao")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnaliseVendasRegiao(
            @RequestParam String dataInicio,
            @RequestParam String dataFim) {
        try {
            log.info("[ANALYTICS-CTRL] GET /api/v1/admin/analise/vendas-regiao - DataInicio: {}, DataFim: {}", 
                    dataInicio, dataFim);
            Map<String, Object> result = adminWorkflowService.getAnaliseVendasRegiao(dataInicio, dataFim);
            log.info("[ANALYTICS-CTRL] Análise de vendas por região obtida com sucesso");
            return ResponseEntity.ok(ApiResponse.success(result, "OK"));
        } catch (Exception e) {
            log.error("[ANALYTICS-CTRL] Erro ao obter análise de vendas por região", e);
            throw e;
        }
    }
}
