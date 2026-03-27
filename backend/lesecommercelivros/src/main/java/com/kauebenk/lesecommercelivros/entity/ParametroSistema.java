package com.kauebenk.lesecommercelivros.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class ParametroSistema {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String chave;
    private String valor;
    private String descricao;
}