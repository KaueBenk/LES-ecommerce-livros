package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.CupomPromocional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CupomPromocionalRepository extends JpaRepository<CupomPromocional, Long> {
    Optional<CupomPromocional> findByCodigo(String codigo);
    Optional<CupomPromocional> findByCodigoIgnoreCase(String codigo);
}
