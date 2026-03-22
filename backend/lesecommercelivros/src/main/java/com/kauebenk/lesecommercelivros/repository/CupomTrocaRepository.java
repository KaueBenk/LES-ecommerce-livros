package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.CupomTroca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CupomTrocaRepository extends JpaRepository<CupomTroca, Long> {
    List<CupomTroca> findByClienteId(Long clienteId);
    List<CupomTroca> findByClienteIdAndUtilizadoFalseOrderByDataGeracaoDesc(Long clienteId);
    List<CupomTroca> findByIdInAndClienteIdAndUtilizadoFalse(List<Long> ids, Long clienteId);
}
