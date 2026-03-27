package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.entity.Endereco;
import com.kauebenk.lesecommercelivros.entity.CartaoCredito;
import com.kauebenk.lesecommercelivros.service.ClienteService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @GetMapping("/perfil")
    public ResponseEntity<ApiResponse<Cliente>> getPerfil() {
        return ResponseEntity.ok(ApiResponse.success(clienteService.getPerfil(), "OK"));
    }

    @PutMapping("/perfil")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> updatePerfil(@RequestBody Cliente cliente) {
        log.info("[CLIENTE-CTRL] PUT /api/v1/clientes/perfil - Atualizando perfil do cliente");
        clienteService.updatePerfil(cliente);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Perfil atualizado com sucesso"));
    }

    @GetMapping("/enderecos")
    public ResponseEntity<ApiResponse<List<Endereco>>> getEnderecos() {
        return ResponseEntity.ok(ApiResponse.success(clienteService.getEnderecos(), "OK"));
    }

    @PostMapping("/enderecos")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addEndereco(@RequestBody Endereco endereco) {
        log.info("[CLIENTE-CTRL] POST /api/v1/clientes/enderecos - Adicionando novo endereço");
        Endereco saved = clienteService.addEndereco(endereco);
        return ResponseEntity.status(201).body(ApiResponse.created(Map.of("id", saved.getId(), "success", true), "Endereço adicionado com sucesso"));
    }

    @PutMapping("/enderecos/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> updateEndereco(@PathVariable Long id, @RequestBody Endereco endereco) {
        log.info("[CLIENTE-CTRL] PUT /api/v1/clientes/enderecos/{} - Atualizando endereço", id);
        clienteService.updateEndereco(id, endereco);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Endereço atualizado com sucesso"));
    }

    @DeleteMapping("/enderecos/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> deleteEndereco(@PathVariable Long id) {
        log.info("[CLIENTE-CTRL] DELETE /api/v1/clientes/enderecos/{} - Removendo endereço", id);
        clienteService.deleteEndereco(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Endereço removido com sucesso"));
    }

    @GetMapping("/cartoes")
    public ResponseEntity<ApiResponse<List<CartaoCredito>>> getCartoes() {
        return ResponseEntity.ok(ApiResponse.success(clienteService.getCartoes(), "OK"));
    }

    @PostMapping("/cartoes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addCartao(@RequestBody Map<String, Object> payload) {
        log.info("[CLIENTE-CTRL] POST /api/v1/clientes/cartoes - Adicionando novo cartão");
        CartaoCredito saved = clienteService.addCartao(payload);
        return ResponseEntity.status(201).body(ApiResponse.created(Map.of("id", saved.getId(), "success", true), "Cartão adicionado com sucesso"));
    }

    @PutMapping("/cartoes/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> updateCartao(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        log.info("[CLIENTE-CTRL] PUT /api/v1/clientes/cartoes/{} - Atualizando cartão", id);
        clienteService.updateCartao(id, payload);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Cartão atualizado com sucesso"));
    }

    @PatchMapping("/cartoes/{id}/preferencial")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> setPreferencial(@PathVariable Long id) {
        clienteService.setCartaoPreferencial(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Cartão definido como preferencial"));
    }
    
    @DeleteMapping("/cartoes/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> deleteCartao(@PathVariable Long id) {
        log.info("[CLIENTE-CTRL] DELETE /api/v1/clientes/cartoes/{} - Removendo cartão", id);
        clienteService.deleteCartao(id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Cartão removido com sucesso"));
    }

    @GetMapping("/transacoes")
    public ResponseEntity<ApiResponse<PaginatedResponse<Map<String, Object>>>> getTransacoes(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(clienteService.getTransacoes(pageable), "OK"));
    }

    @GetMapping("/cupons-troca")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCuponsTroca() {
        return ResponseEntity.ok(ApiResponse.success(clienteService.getCuponsTroca(), "OK"));
    }
}
