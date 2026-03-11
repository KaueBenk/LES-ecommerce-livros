package com.kauebenk.lesecommercelivros.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
public class CupomPromocional {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String codigo;
    private BigDecimal valor;
    private Boolean valido = true;
    private LocalDate dataValidade;
}