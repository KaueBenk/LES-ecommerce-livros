package com.kauebenk.lesecommercelivros.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
public class CupomTroca {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;
    private BigDecimal valor;
    private Boolean utilizado = false;
    private LocalDateTime dataGeracao;
    @ManyToOne
    @JoinColumn(name = "pedido_origem_id")
    private Pedido pedidoOrigem;
}