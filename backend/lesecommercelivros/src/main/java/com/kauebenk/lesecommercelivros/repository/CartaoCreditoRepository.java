package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.CartaoCredito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartaoCreditoRepository extends JpaRepository<CartaoCredito, Long> {
    List<CartaoCredito> findByClienteId(Long clienteId);
    Optional<CartaoCredito> findByIdAndClienteId(Long id, Long clienteId);
}
