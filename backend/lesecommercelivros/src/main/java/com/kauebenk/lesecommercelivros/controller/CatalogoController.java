package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.entity.Autor;
import com.kauebenk.lesecommercelivros.entity.Categoria;
import com.kauebenk.lesecommercelivros.entity.Editora;
import com.kauebenk.lesecommercelivros.repository.AutorRepository;
import com.kauebenk.lesecommercelivros.repository.CategoriaRepository;
import com.kauebenk.lesecommercelivros.repository.EditoraRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/catalogo")
public class CatalogoController {

    @Autowired
    private AutorRepository autorRepository;

    @Autowired
    private EditoraRepository editoraRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @GetMapping("/autores")
    public ResponseEntity<ApiResponse<List<Autor>>> getAutores() {
        try {
            log.info("[CATALOG-CTRL] GET /api/v1/catalogo/autores");
            List<Autor> autores = autorRepository.findAll();
            log.debug("[CATALOG-CTRL] Autores encontrados: {}", autores.size());
            return ResponseEntity.ok(ApiResponse.success(autores, "OK"));
        } catch (Exception e) {
            log.error("[CATALOG-CTRL] Erro ao obter autores", e);
            throw e;
        }
    }

    @GetMapping("/editoras")
    public ResponseEntity<ApiResponse<List<Editora>>> getEditoras() {
        try {
            log.info("[CATALOG-CTRL] GET /api/v1/catalogo/editoras");
            List<Editora> editoras = editoraRepository.findAll();
            log.debug("[CATALOG-CTRL] Editoras encontradas: {}", editoras.size());
            return ResponseEntity.ok(ApiResponse.success(editoras, "OK"));
        } catch (Exception e) {
            log.error("[CATALOG-CTRL] Erro ao obter editoras", e);
            throw e;
        }
    }

    @GetMapping("/categorias")
    public ResponseEntity<ApiResponse<List<Categoria>>> getCategorias() {
        try {
            log.info("[CATALOG-CTRL] GET /api/v1/catalogo/categorias");
            List<Categoria> categorias = categoriaRepository.findAll();
            log.debug("[CATALOG-CTRL] Categorias encontradas: {}", categorias.size());
            return ResponseEntity.ok(ApiResponse.success(categorias, "OK"));
        } catch (Exception e) {
            log.error("[CATALOG-CTRL] Erro ao obter categorias", e);
            throw e;
        }
    }
}
