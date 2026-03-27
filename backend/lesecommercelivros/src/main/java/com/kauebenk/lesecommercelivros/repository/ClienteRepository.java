package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findFirstByEmailIgnoreCaseOrderByIdAsc(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByCpf(String cpf);

    @Query("""
            select c from Cliente c
            where (coalesce(:nome, '') = '' or lower(c.nome) like concat('%', lower(cast(:nome as string)), '%'))
              and (coalesce(:cpf, '') = '' or c.cpf = cast(:cpf as string))
              and (coalesce(:email, '') = '' or lower(c.email) like concat('%', lower(cast(:email as string)), '%'))
              and (:ativo is null or c.ativo = :ativo)
            """)
    Page<Cliente> search(
            @Param("nome") String nome,
            @Param("cpf") String cpf,
            @Param("email") String email,
            @Param("ativo") Boolean ativo,
            Pageable pageable
    );
}
