package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.repository.ParametroSistemaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ParametroSistemaService {

    @Autowired
    private ParametroSistemaRepository parametroSistemaRepository;

    public long getLong(String chave, long valorPadrao) {
        return parametroSistemaRepository.findByChave(chave)
                .map(parametro -> parseLong(chave, parametro.getValor()))
                .orElse(valorPadrao);
    }

    public BigDecimal getBigDecimal(String chave, BigDecimal valorPadrao) {
        return parametroSistemaRepository.findByChave(chave)
                .map(parametro -> parseBigDecimal(chave, parametro.getValor()))
                .orElse(valorPadrao);
    }

    private long parseLong(String chave, String raw) {
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException ex) {
            throw new IllegalStateException("Valor inválido para parâmetro numérico: " + chave, ex);
        }
    }

    private BigDecimal parseBigDecimal(String chave, String raw) {
        try {
            return new BigDecimal(raw);
        } catch (NumberFormatException ex) {
            throw new IllegalStateException("Valor inválido para parâmetro decimal: " + chave, ex);
        }
    }
}
