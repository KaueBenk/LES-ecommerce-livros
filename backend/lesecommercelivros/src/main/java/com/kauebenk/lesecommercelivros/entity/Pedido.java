package com.kauebenk.lesecommercelivros.entity;

import com.kauebenk.lesecommercelivros.entity.enums.StatusPedido;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL)
    private List<ItemPedido> itens;
    @Column(columnDefinition = "TEXT")
    private String enderecoEntrega;
    @Enumerated(EnumType.STRING)
    private StatusPedido status;
    private BigDecimal valorFrete;
    private BigDecimal valorTotal;
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL)
    private List<FormaPagamento> formasPagamento;
    private LocalDateTime dataPedido;
}