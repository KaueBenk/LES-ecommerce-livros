package com.kauebenk.lesecommercelivros.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Notificacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;
    private String titulo;
    private String mensagem;
    private String referencia;
    private String tipo;
    private Boolean lida = false;
    private LocalDateTime dataCriacao;
}
