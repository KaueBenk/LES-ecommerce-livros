package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.Notificacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {
    boolean existsByClienteId(Long clienteId);
    Page<Notificacao> findByClienteIdOrderByDataCriacaoDesc(Long clienteId, Pageable pageable);
    Page<Notificacao> findByClienteIdAndLidaOrderByDataCriacaoDesc(Long clienteId, Boolean lida, Pageable pageable);
    long countByClienteIdAndLidaFalse(Long clienteId);
    Optional<Notificacao> findByIdAndClienteId(Long id, Long clienteId);
}
