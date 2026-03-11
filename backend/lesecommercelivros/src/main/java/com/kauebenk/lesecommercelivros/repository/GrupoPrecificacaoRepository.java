package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.GrupoPrecificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GrupoPrecificacaoRepository extends JpaRepository<GrupoPrecificacao, Long> {
}
