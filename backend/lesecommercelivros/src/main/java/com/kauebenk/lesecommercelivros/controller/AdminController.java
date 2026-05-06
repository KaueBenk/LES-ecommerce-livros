package com.kauebenk.lesecommercelivros.controller;

import com.kauebenk.lesecommercelivros.dto.ApiResponse;
import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.entity.EntradaEstoque;
import com.kauebenk.lesecommercelivros.entity.Fornecedor;
import com.kauebenk.lesecommercelivros.entity.GrupoPrecificacao;
import com.kauebenk.lesecommercelivros.entity.Livro;
import com.kauebenk.lesecommercelivros.service.AdminService;
import com.kauebenk.lesecommercelivros.service.AdminWorkflowService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private AdminWorkflowService adminWorkflowService;

    @GetMapping("/livros")
    public ResponseEntity<ApiResponse<PaginatedResponse<Livro>>> getAllLivros(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllLivros(pageable), "OK"));
    }

    @PostMapping("/livros")
    public ResponseEntity<ApiResponse<Livro>> createLivro(@RequestBody Map<String, Object> request) {
        log.info("[ADMIN-CTRL] POST /api/v1/admin/livros - Criando novo livro");
        return ResponseEntity.status(201).body(ApiResponse.created(adminService.createLivro(request), "Livro criado"));
    }

    @PutMapping("/livros/{id}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> updateLivro(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        log.info("[ADMIN-CTRL] PUT /api/v1/admin/livros/{} - Atualizando livro", id);
        adminService.updateLivro(id, request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Livro atualizado"));
    }
    
    @PatchMapping("/livros/{id}/inativar")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> inativarLivro(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/livros/{}/inativar - Inativando livro", id);
        adminService.inativarLivro(id, req);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Livro inativado"));
    }

    @PatchMapping("/livros/{id}/ativar")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> ativarLivro(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/livros/{}/ativar - Ativando livro", id);
        adminService.ativarLivro(id, req);
        return ResponseEntity.ok(ApiResponse.success(Map.of("success", true), "Livro ativado"));
    }

    @PostMapping("/livros/inativacao-automatica")
    public ResponseEntity<ApiResponse<Map<String, Object>>> executarInativacaoAutomaticaLivros() {
        return ResponseEntity.ok(ApiResponse.success(
                adminService.executarInativacaoAutomaticaLivros(),
                "Inativação automática processada"
        ));
    }

    @GetMapping("/grupos-precificacao")
    public ResponseEntity<ApiResponse<List<GrupoPrecificacao>>> getGruposPrecificacao() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getPricingGroups(), "OK"));
    }

    @GetMapping("/fornecedores")
    public ResponseEntity<ApiResponse<List<Fornecedor>>> getFornecedores() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getFornecedores(), "OK"));
    }

    @GetMapping("/estoque/entradas")
    public ResponseEntity<ApiResponse<PaginatedResponse<EntradaEstoque>>> getEntradasEstoque(
            @RequestParam(required = false) Long livroId,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getStockEntries(livroId, pageable), "OK"));
    }

    @PostMapping("/estoque/entradas")
    public ResponseEntity<ApiResponse<EntradaEstoque>> createEntradaEstoque(@RequestBody Map<String, Object> request) {
        log.info("[ADMIN-CTRL] POST /api/v1/admin/estoque/entradas - Registrando entrada de estoque");
        return ResponseEntity
                .status(201)
                .body(ApiResponse.created(adminService.createStockEntry(request), "Entrada registrada"));
    }

    @GetMapping("/pedidos")
    public ResponseEntity<ApiResponse<PaginatedResponse<Map<String, Object>>>> getPedidos(
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.getPedidos(status, pageable), "OK"));
    }

    @PatchMapping("/pedidos/{id}/despachar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> despacharPedido(@PathVariable Long id) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/pedidos/{}/despachar - Despachando pedido", id);
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.despacharPedido(id), "Pedido despachado"));
    }

    @PatchMapping("/pedidos/{id}/entregar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> entregarPedido(@PathVariable Long id) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/pedidos/{}/entregar - Entregando pedido", id);
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.entregarPedido(id), "Pedido entregue"));
    }

    @PatchMapping("/pedidos/{id}/confirmar-pagamento")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmarPagamento(@PathVariable Long id) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/pedidos/{}/confirmar-pagamento - Confirmando pagamento", id);
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.confirmarPagamento(id), "Pagamento confirmado"));
    }

    @GetMapping("/clientes")
    public ResponseEntity<ApiResponse<PaginatedResponse<Map<String, Object>>>> getClientes(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cpf,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Boolean ativo,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                adminWorkflowService.getClientes(nome, cpf, email, ativo, pageable),
                "OK"
        ));
    }

    @GetMapping("/clientes/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCliente(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.getCliente(id), "OK"));
    }

    @PatchMapping("/clientes/{id}/inativar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> inativarCliente(@PathVariable Long id) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/clientes/{}/inativar - Inativando cliente", id);
        return ResponseEntity.ok(ApiResponse.success(
                adminWorkflowService.inativarCliente(id),
                "Cliente inativado"
        ));
    }

    @PatchMapping("/clientes/{id}/ativar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ativarCliente(@PathVariable Long id) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/clientes/{}/ativar - Ativando cliente", id);
        return ResponseEntity.ok(ApiResponse.success(
                adminWorkflowService.ativarCliente(id),
                "Cliente ativado"
        ));
    }

    @DeleteMapping("/clientes/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> excluirCliente(@PathVariable Long id) {
        log.info("[ADMIN-CTRL] DELETE /api/v1/admin/clientes/{} - Excluindo cliente", id);
        return ResponseEntity.ok(ApiResponse.success(
                adminWorkflowService.excluirCliente(id),
                "Cliente excluído"
        ));
    }

    @GetMapping("/avaliacoes")
    public ResponseEntity<ApiResponse<PaginatedResponse<Map<String, Object>>>> getAvaliacoes(
            @RequestParam(required = false) Boolean aprovada,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.getAvaliacoes(aprovada, pageable), "OK"));
    }

    @GetMapping("/avaliacoes/pendentes")
    public ResponseEntity<ApiResponse<PaginatedResponse<Map<String, Object>>>> getAvaliacoesPendentes(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.getAvaliacoes(false, pageable), "OK"));
    }

    @PatchMapping("/avaliacoes/{id}/aprovar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> aprovarAvaliacao(@PathVariable Long id) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/avaliacoes/{}/aprovar - Aprovando avaliação", id);
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.aprovarAvaliacao(id), "Avaliação aprovada"));
    }

    @PutMapping("/avaliacoes/{id}/aprovar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> aprovarAvaliacaoCompat(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.aprovarAvaliacao(id), "Avaliação aprovada"));
    }

    @PatchMapping("/avaliacoes/{id}/rejeitar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejeitarAvaliacao(@PathVariable Long id) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/avaliacoes/{}/rejeitar - Rejeitando avaliação", id);
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.rejeitarAvaliacao(id), "Avaliação rejeitada"));
    }

    @PutMapping("/avaliacoes/{id}/rejeitar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejeitarAvaliacaoCompat(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.rejeitarAvaliacao(id), "Avaliação rejeitada"));
    }

    @GetMapping("/trocas")
    public ResponseEntity<ApiResponse<PaginatedResponse<Map<String, Object>>>> getTrocas(
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.getTrocas(status, pageable), "OK"));
    }

    @PatchMapping("/trocas/{id}/autorizar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> autorizarTroca(@PathVariable Long id) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/trocas/{}/autorizar - Autorizando troca", id);
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.autorizarTroca(id), "Troca autorizada"));
    }

    @PatchMapping("/trocas/{id}/rejeitar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejeitarTroca(@PathVariable Long id) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/trocas/{}/rejeitar - Rejeitando troca", id);
        return ResponseEntity.ok(ApiResponse.success(adminWorkflowService.rejeitarTroca(id), "Troca rejeitada"));
    }

    @PatchMapping("/trocas/{id}/confirmar-recebimento")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmarRecebimento(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload
    ) {
        log.info("[ADMIN-CTRL] PATCH /api/v1/admin/trocas/{}/confirmar-recebimento - Confirmando recebimento de troca", id);
        return ResponseEntity.ok(
                ApiResponse.success(adminWorkflowService.confirmarRecebimentoTroca(id, payload), "Troca finalizada, cupom gerado")
        );
    }
}
