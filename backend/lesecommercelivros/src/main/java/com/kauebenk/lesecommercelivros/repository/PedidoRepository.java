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

    @Query(value = """
        SELECT 
          TO_CHAR(p.data_pedido, 'YYYY-MM') as mes,
          l.titulo as livroTitulo,
          (SELECT c.nome FROM categoria c JOIN livro_categoria lc ON c.id = lc.categoria_id WHERE lc.livro_id = l.id ORDER BY c.id LIMIT 1) as categoriaNome,
          SUM(i.quantidade) as totalQuantidade,
          SUM(i.quantidade * i.valor_unitario) as totalValor
        FROM pedido p
        JOIN item_pedido i ON i.pedido_id = p.id
        JOIN livro l ON i.livro_id = l.id
        WHERE p.data_pedido >= :dataInicio AND p.data_pedido <= :dataFim
          AND p.status IN ('APROVADA', 'EM_TRANSITO', 'ENTREGUE', 'EM_TROCA', 'TROCA_AUTORIZADA', 'TROCADO')
        GROUP BY 
          TO_CHAR(p.data_pedido, 'YYYY-MM'),
          l.id, l.titulo
        """, nativeQuery = true)
    List<Object[]> getAnaliseVendasRaw(
        @Param("dataInicio") LocalDateTime dataInicio, 
        @Param("dataFim") LocalDateTime dataFim
    );

    @Query(value = """
        SELECT 
          SPLIT_PART(p.endereco_entrega, ',', 5) as estado,
          SUM(i.quantidade) as totalQuantidade,
          SUM(i.quantidade * i.valor_unitario) as totalValor
        FROM pedido p
        JOIN item_pedido i ON i.pedido_id = p.id
        WHERE p.data_pedido >= :dataInicio AND p.data_pedido <= :dataFim
          AND p.status IN ('APROVADA', 'EM_TRANSITO', 'ENTREGUE', 'EM_TROCA', 'TROCA_AUTORIZADA', 'TROCADO')
          AND p.endereco_entrega IS NOT NULL
        GROUP BY SPLIT_PART(p.endereco_entrega, ',', 5)
        """, nativeQuery = true)
    List<Object[]> getAnaliseVendasRegiaoRaw(
        @Param("dataInicio") LocalDateTime dataInicio, 
        @Param("dataFim") LocalDateTime dataFim
    );

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
