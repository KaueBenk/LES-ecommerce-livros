package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.Avaliacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {
    Page<Avaliacao> findByLivroId(Long livroId, Pageable pageable);
    Page<Avaliacao> findByLivroIdAndAprovada(Long livroId, Boolean aprovada, Pageable pageable);
    Page<Avaliacao> findByAprovada(Boolean aprovada, Pageable pageable);
}
