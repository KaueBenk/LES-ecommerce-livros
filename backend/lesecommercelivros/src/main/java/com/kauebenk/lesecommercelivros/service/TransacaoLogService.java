package com.kauebenk.lesecommercelivros.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kauebenk.lesecommercelivros.entity.LogTransacao;
import com.kauebenk.lesecommercelivros.entity.enums.OperacaoLog;
import com.kauebenk.lesecommercelivros.repository.LogTransacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class TransacaoLogService {

    @Autowired
    private LogTransacaoRepository logTransacaoRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public void registrar(
            String entidade,
            Long entidadeId,
            OperacaoLog operacao,
            Object dadosAnteriores,
            Object dadosNovos
    ) {
        LogTransacao log = new LogTransacao();
        log.setEntidade(entidade);
        log.setEntidadeId(entidadeId);
        log.setOperacao(operacao);
        log.setDadosAnteriores(toJson(dadosAnteriores));
        log.setDadosNovos(toJson(dadosNovos));
        log.setUsuario(getUsuarioAtual());
        log.setDataHora(LocalDateTime.now());
        logTransacaoRepository.save(log);
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Falha ao serializar log de transação", ex);
        }
    }

    private String getUsuarioAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return "SISTEMA";
        }
        return authentication.getName();
    }
}
