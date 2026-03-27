package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.Pedido;
import com.kauebenk.lesecommercelivros.entity.enums.StatusPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    boolean existsByClienteId(Long clienteId);
    Page<Pedido> findByClienteId(Long clienteId, Pageable pageable);
    List<Pedido> findTop20ByClienteIdOrderByDataPedidoDesc(Long clienteId);
    Optional<Pedido> findByIdAndClienteId(Long id, Long clienteId);
    Page<Pedido> findByStatus(StatusPedido status, Pageable pageable);
    List<Pedido> findByStatusIn(List<StatusPedido> statuses);
    List<Pedido> findByDataPedidoBetween(LocalDateTime dataInicio, LocalDateTime dataFim);

    @Query("""
            select coalesce(sum(i.valorUnitario * i.quantidade), 0)
            from Pedido p
            join p.itens i
            where i.livro.id = :livroId
              and p.status in :statuses
            """)
    BigDecimal sumValorVendidoByLivroIdAndStatusIn(
            @Param("livroId") Long livroId,
            @Param("statuses") List<StatusPedido> statuses
    );

    @Query("""
            select case when count(p) > 0 then true else false end
            from Pedido p
            join p.itens i
            where p.cliente.id = :clienteId
              and p.status = com.kauebenk.lesecommercelivros.entity.enums.StatusPedido.ENTREGUE
              and i.livro.id = :livroId
            """)
    boolean hasDeliveredPurchaseForBook(@Param("clienteId") Long clienteId, @Param("livroId") Long livroId);
}
