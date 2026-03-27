package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.ItemPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItemPedidoRepository extends JpaRepository<ItemPedido, Long> {
    Optional<ItemPedido> findByIdAndPedidoId(Long id, Long pedidoId);
}
