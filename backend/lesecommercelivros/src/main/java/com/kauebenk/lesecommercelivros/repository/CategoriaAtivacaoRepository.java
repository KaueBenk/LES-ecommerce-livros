package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.CategoriaAtivacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriaAtivacaoRepository extends JpaRepository<CategoriaAtivacao, Long> {
}
