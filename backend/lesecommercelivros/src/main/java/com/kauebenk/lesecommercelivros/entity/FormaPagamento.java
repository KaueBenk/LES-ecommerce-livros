package com.kauebenk.lesecommercelivros.entity;

import com.kauebenk.lesecommercelivros.entity.enums.TipoPagamento;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Data
public class FormaPagamento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private TipoPagamento tipo;
    private BigDecimal valor;
    @ManyToOne
    @JoinColumn(name = "cartao_credito_id")
    private CartaoCredito cartaoCredito;
    private Long cupom;
    @ManyToOne
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;
}