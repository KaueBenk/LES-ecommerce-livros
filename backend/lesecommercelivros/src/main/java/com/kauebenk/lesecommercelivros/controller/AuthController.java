package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.dto.LoginRequest;
import com.kauebenk.lesecommercelivros.dto.RegisterRequest;
import com.kauebenk.lesecommercelivros.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(ApiResponse.created(authService.register(request), "Cliente cadastrado com sucesso"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request), "Login realizado com sucesso"));
    }

    @PutMapping("/senha")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> updateSenha(@RequestBody Map<String, String> request) {
        authService.updateSenha(request.get("senhaAtual"), request.get("novaSenha"), request.get("confirmacaoSenha"));
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Senha alterada com sucesso"));
    }
}
