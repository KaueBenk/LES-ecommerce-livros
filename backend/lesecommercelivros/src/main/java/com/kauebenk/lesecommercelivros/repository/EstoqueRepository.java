package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.Estoque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EstoqueRepository extends JpaRepository<Estoque, Long> {
    Optional<Estoque> findByLivroId(Long livroId);
}
