package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.LogTransacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LogTransacaoRepository extends JpaRepository<LogTransacao, Long> {
}
