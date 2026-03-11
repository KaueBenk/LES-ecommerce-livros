package com.kauebenk.lesecommercelivros.entity;

import com.kauebenk.lesecommercelivros.entity.enums.StatusTroca;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
public class SolicitacaoTroca {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;
    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "solicitacao_troca_id")
    private List<ItemTroca> itensDevolvidos;
    @Enumerated(EnumType.STRING)
    private StatusTroca status;
    private LocalDateTime dataSolicitacao;
}