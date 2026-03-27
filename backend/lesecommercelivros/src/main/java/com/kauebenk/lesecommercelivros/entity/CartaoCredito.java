package com.kauebenk.lesecommercelivros.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class CartaoCredito {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String numero;
    private String nomeImpresso;
    @ManyToOne
    @JoinColumn(name = "bandeira_id")
    private Bandeira bandeira;
    private String codigoSeguranca;
    private Boolean preferencial = false;
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Cliente cliente;
}