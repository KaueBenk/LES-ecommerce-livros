package com.kauebenk.lesecommercelivros.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class ItemTroca {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "item_pedido_id")
    private ItemPedido itemPedido;
    private Integer quantidade;
    private String justificativa;
    private Boolean retornarAoEstoque;
}