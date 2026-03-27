package com.kauebenk.lesecommercelivros.entity;

import com.kauebenk.lesecommercelivros.entity.enums.OperacaoLog;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class LogTransacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String entidade;
    private Long entidadeId;
    @Enumerated(EnumType.STRING)
    private OperacaoLog operacao;
    @Column(columnDefinition = "TEXT")
    private String dadosAnteriores;
    @Column(columnDefinition = "TEXT")
    private String dadosNovos;
    private String usuario;
    private LocalDateTime dataHora;
}