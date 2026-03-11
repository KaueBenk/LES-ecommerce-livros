package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.CarrinhoCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CarrinhoCompraRepository extends JpaRepository<CarrinhoCompra, Long> {
    Optional<CarrinhoCompra> findByClienteId(Long clienteId);
}
