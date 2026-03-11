package com.kauebenk.lesecommercelivros.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class ItemCarrinho {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "livro_id")
    private Livro livro;
    private Integer quantidade;
    private LocalDateTime bloqueadoEm;
    @ManyToOne
    @JoinColumn(name = "carrinho_id")
    private CarrinhoCompra carrinho;
}