package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.dto.PaginatedResponse;
import com.kauebenk.lesecommercelivros.entity.Cliente;
import com.kauebenk.lesecommercelivros.entity.Notificacao;
import com.kauebenk.lesecommercelivros.repository.ClienteRepository;
import com.kauebenk.lesecommercelivros.repository.NotificacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class NotificacaoService {

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Transactional(readOnly = true)
    public PaginatedResponse<Map<String, Object>> listar(Pageable pageable, Boolean lida) {
        Cliente cliente = getAuthenticatedCliente();
        Page<Notificacao> page = lida == null
                ? notificacaoRepository.findByClienteIdOrderByDataCriacaoDesc(cliente.getId(), pageable)
                : notificacaoRepository.findByClienteIdAndLidaOrderByDataCriacaoDesc(cliente.getId(), lida, pageable);
        Page<Map<String, Object>> mapped = page.map(this::toResponse);
        return new PaginatedResponse<>(mapped);
    }

    @Transactional(readOnly = true)
    public long contarNaoLidas() {
        Cliente cliente = getAuthenticatedCliente();
        return notificacaoRepository.countByClienteIdAndLidaFalse(cliente.getId());
    }

    public void marcarComoLida(Long id) {
        Cliente cliente = getAuthenticatedCliente();
        Notificacao notificacao = notificacaoRepository.findByIdAndClienteId(id, cliente.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificação não encontrada"));
        notificacao.setLida(true);
        notificacaoRepository.save(notificacao);
    }

    public Notificacao criar(Cliente cliente, String titulo, String mensagem, String referencia, String tipo) {
        Notificacao notificacao = new Notificacao();
        notificacao.setCliente(cliente);
        notificacao.setTitulo(titulo);
        notificacao.setMensagem(mensagem);
        notificacao.setReferencia(referencia);
        notificacao.setTipo(tipo);
        notificacao.setLida(false);
        notificacao.setDataCriacao(LocalDateTime.now());
        return notificacaoRepository.save(notificacao);
    }

    private Map<String, Object> toResponse(Notificacao notificacao) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", notificacao.getId());
        map.put("titulo", notificacao.getTitulo());
        map.put("mensagem", notificacao.getMensagem());
        map.put("referencia", notificacao.getReferencia());
        map.put("tipo", notificacao.getTipo());
        map.put("lida", notificacao.getLida());
        map.put("status", Boolean.TRUE.equals(notificacao.getLida()) ? "LIDA" : "NAO_LIDA");
        map.put("dataCriacao", notificacao.getDataCriacao());
        return map;
    }

    private Cliente getAuthenticatedCliente() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado");
        }
        return clienteRepository.findFirstByEmailIgnoreCaseOrderByIdAsc(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cliente não encontrado"));
    }
}
