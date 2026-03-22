package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.service.CheckoutService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/checkout")
public class CheckoutController {

    @Autowired
    private CheckoutService checkoutService;

    @PostMapping("/frete")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calcularFrete(@RequestBody Map<String, Object> req) {
        return ResponseEntity.ok(ApiResponse.success(checkoutService.calcularFrete(req), "Frete calculado"));
    }

    @PostMapping("/validar-cupons")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validarCupons(@RequestBody Map<String, Object> req) {
        log.info("[CHECKOUT-CTRL] POST /api/v1/checkout/validar-cupons - Validando cupons de desconto");
        return ResponseEntity.ok(ApiResponse.success(checkoutService.validarCupons(req), "Cupons validados"));
    }

    @PostMapping("/finalizar")
    public ResponseEntity<?> finalizarCompra(@RequestBody Map<String, Object> req) {
        log.info("[CHECKOUT-CTRL] POST /api/v1/checkout/finalizar - Finalizando compra");
        try {
            return ResponseEntity.status(201)
                    .body(ApiResponse.created(checkoutService.finalizarCompra(req), "Compra finalizada com sucesso"));
        } catch (CheckoutService.PaymentRejectedException ex) {
            return ResponseEntity.status(402).body(Map.of(
                    "statusCode", 402,
                    "message", ex.getMessage(),
                    "pedidoId", ex.getPedidoId(),
                    "errors", ex.getErrors() == null ? List.of() : ex.getErrors()
            ));
        }
    }
}
