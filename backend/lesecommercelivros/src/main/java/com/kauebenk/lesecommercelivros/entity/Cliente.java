package com.kauebenk.lesecommercelivros.entity;

import com.kauebenk.lesecommercelivros.entity.enums.Genero;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Data
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    private Genero genero;
    private String nome;
    private LocalDate dataNascimento;
    private String cpf;
    private String email;
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String senha;
    private String role = "ROLE_CLIENTE";
    private BigDecimal ranking = BigDecimal.ZERO;
    private Boolean ativo = true;
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    private List<Telefone> telefones;
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    private List<Endereco> enderecos;
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    private List<CartaoCredito> cartoes;
}