package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.SolicitacaoTroca;
import com.kauebenk.lesecommercelivros.entity.enums.StatusTroca;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SolicitacaoTrocaRepository extends JpaRepository<SolicitacaoTroca, Long> {
    Page<SolicitacaoTroca> findByStatus(StatusTroca status, Pageable pageable);
}
