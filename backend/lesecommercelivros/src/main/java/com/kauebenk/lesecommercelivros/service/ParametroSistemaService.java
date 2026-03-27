package com.kauebenk.lesecommercelivros.service;

import com.kauebenk.lesecommercelivros.repository.ParametroSistemaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
public class ParametroSistemaService {

    @Autowired
    private ParametroSistemaRepository parametroSistemaRepository;

    public long getLong(String chave, long valorPadrao) {
        try {
            long result = parametroSistemaRepository.findByChave(chave)
                    .map(parametro -> parseLong(chave, parametro.getValor()))
                    .orElse(valorPadrao);
            log.debug("[PARAM-SYS] getLong - Chave: {}, Valor: {}", chave, result);
            return result;
        } catch (Exception e) {
            log.error("[PARAM-SYS] Erro ao obter parâmetro getLong - Chave: {}", chave, e);
            throw e;
        }
    }

    public BigDecimal getBigDecimal(String chave, BigDecimal valorPadrao) {
        try {
            BigDecimal result = parametroSistemaRepository.findByChave(chave)
                    .map(parametro -> parseBigDecimal(chave, parametro.getValor()))
                    .orElse(valorPadrao);
            log.debug("[PARAM-SYS] getBigDecimal - Chave: {}, Valor: {}", chave, result);
            return result;
        } catch (Exception e) {
            log.error("[PARAM-SYS] Erro ao obter parâmetro getBigDecimal - Chave: {}", chave, e);
            throw e;
        }
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
