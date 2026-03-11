package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.service.CarrinhoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/carrinho")
public class CarrinhoController {

    @Autowired
    private CarrinhoService carrinhoService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCarrinho() {
        return ResponseEntity.ok(ApiResponse.success(carrinhoService.getCarrinho(), "OK"));
    }

    @PostMapping("/itens")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addItem(@RequestBody Map<String, Integer> request) {
        return ResponseEntity.status(201).body(ApiResponse.created(carrinhoService.addItem(request), "Item adicionado ao carrinho"));
    }

    @PutMapping("/itens/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> updateItem(@PathVariable Long id, @RequestBody Map<String, Integer> request) {
        carrinhoService.updateItem(id, request.get("quantidade"));
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Item atualizado"));
    }

    @DeleteMapping("/itens/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> deleteItem(@PathVariable Long id) {
        carrinhoService.deleteItem(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Item removido"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> clearCarrinho() {
        carrinhoService.clearCart();
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Carrinho esvaziado"));
    }
}
