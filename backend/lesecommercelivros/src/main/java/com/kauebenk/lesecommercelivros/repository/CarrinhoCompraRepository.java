package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.CarrinhoCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CarrinhoCompraRepository extends JpaRepository<CarrinhoCompra, Long> {
    @Query("""
            select case when count(i) > 0 then true else false end
            from ItemCarrinho i
            where i.carrinho.cliente.id = :clienteId
            """)
    boolean existsItemsByClienteId(@Param("clienteId") Long clienteId);

    Optional<CarrinhoCompra> findByClienteId(Long clienteId);

    @Modifying
    @Query("""
            delete from CarrinhoCompra c
            where c.cliente.id = :clienteId
            """)
    int deleteAllByClienteId(@Param("clienteId") Long clienteId);
}
