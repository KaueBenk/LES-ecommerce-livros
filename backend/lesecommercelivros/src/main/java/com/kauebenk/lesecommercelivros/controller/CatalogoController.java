package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.entity.Autor;
import com.kauebenk.lesecommercelivros.entity.Categoria;
import com.kauebenk.lesecommercelivros.entity.Editora;
import com.kauebenk.lesecommercelivros.repository.AutorRepository;
import com.kauebenk.lesecommercelivros.repository.CategoriaRepository;
import com.kauebenk.lesecommercelivros.repository.EditoraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
        return ResponseEntity.ok(ApiResponse.success(autorRepository.findAll(), "OK"));
    }

    @GetMapping("/editoras")
    public ResponseEntity<ApiResponse<List<Editora>>> getEditoras() {
        return ResponseEntity.ok(ApiResponse.success(editoraRepository.findAll(), "OK"));
    }

    @GetMapping("/categorias")
    public ResponseEntity<ApiResponse<List<Categoria>>> getCategorias() {
        return ResponseEntity.ok(ApiResponse.success(categoriaRepository.findAll(), "OK"));
    }
}
