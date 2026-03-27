package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.CategoriaInativacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoriaInativacaoRepository extends JpaRepository<CategoriaInativacao, Long> {
    Optional<CategoriaInativacao> findFirstByDescricaoIgnoreCase(String descricao);
}
