package com.kauebenk.lesecommercelivros.entity;

import com.kauebenk.lesecommercelivros.entity.enums.TipoTelefone;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Telefone {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private TipoTelefone tipo;
    private String ddd;
    private String numero;
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Cliente cliente;
}