package com.kauebenk.lesecommercelivros.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Estoque {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne
    @JoinColumn(name = "livro_id")
    private Livro livro;
    private Integer quantidadeTotal;
    private Integer quantidadeBloqueada;
    private Integer quantidadeDisponivel;
}