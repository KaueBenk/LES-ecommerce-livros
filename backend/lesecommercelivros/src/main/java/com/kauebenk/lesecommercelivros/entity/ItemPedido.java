package com.kauebenk.lesecommercelivros.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Data
public class ItemPedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "livro_id")
    private Livro livro;
    private Integer quantidade;
    private BigDecimal valorUnitario;
    @ManyToOne
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;
}