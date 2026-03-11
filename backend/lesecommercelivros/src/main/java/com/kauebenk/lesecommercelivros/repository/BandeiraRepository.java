package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.Bandeira;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BandeiraRepository extends JpaRepository<Bandeira, Long> {
    Optional<Bandeira> findFirstByNomeIgnoreCase(String nome);
}
