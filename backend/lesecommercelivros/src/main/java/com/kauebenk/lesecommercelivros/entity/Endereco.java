package com.kauebenk.lesecommercelivros.entity;

import com.kauebenk.lesecommercelivros.entity.enums.TipoResidencia;
import com.kauebenk.lesecommercelivros.entity.enums.TipoLogradouro;
import com.kauebenk.lesecommercelivros.entity.enums.TipoEndereco;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Endereco {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String apelido;
    @Enumerated(EnumType.STRING)
    private TipoResidencia tipoResidencia;
    @Enumerated(EnumType.STRING)
    private TipoLogradouro tipoLogradouro;
    private String logradouro;
    private String numero;
    private String bairro;
    private String cep;
    private String cidade;
    private String estado;
    private String pais = "Brasil";
    private String observacoes;
    @Enumerated(EnumType.STRING)
    private TipoEndereco tipoEndereco;
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Cliente cliente;
}