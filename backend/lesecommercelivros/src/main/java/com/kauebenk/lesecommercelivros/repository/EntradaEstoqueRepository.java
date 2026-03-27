package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.EntradaEstoque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface EntradaEstoqueRepository extends JpaRepository<EntradaEstoque, Long> {
    Page<EntradaEstoque> findByLivroId(Long livroId, Pageable pageable);
}
