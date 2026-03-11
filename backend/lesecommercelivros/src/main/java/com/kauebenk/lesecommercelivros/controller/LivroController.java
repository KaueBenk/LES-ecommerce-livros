package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.entity.Livro;
import com.kauebenk.lesecommercelivros.service.LivroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/livros")
public class LivroController {

    @Autowired
    private LivroService livroService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<Livro>>> getAllLivros(
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) Long autorId,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String isbn,
            @RequestParam(required = false, defaultValue = "true") Boolean ativo,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                livroService.getAllLivros(pageable, titulo, autorId, categoriaId, ano, isbn, ativo),
                "OK"
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Livro>> getLivroById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(livroService.getLivroById(id), "OK"));
    }

    @GetMapping("/{id}/avaliacoes")
    public ResponseEntity<ApiResponse<PaginatedResponse<Map<String, Object>>>> getAvaliacoes(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "true") Boolean aprovada,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(livroService.getAvaliacoesLivro(id, aprovada, pageable), "OK"));
    }

    @PostMapping("/{id}/avaliacoes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> criarAvaliacao(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload
    ) {
        return ResponseEntity
                .status(201)
                .body(ApiResponse.created(livroService.criarAvaliacao(id, payload), "Avaliação enviada para moderação"));
    }
}
