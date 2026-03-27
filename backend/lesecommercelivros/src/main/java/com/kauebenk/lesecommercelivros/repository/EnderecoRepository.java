package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.Endereco;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnderecoRepository extends JpaRepository<Endereco, Long> {
    List<Endereco> findByClienteId(Long clienteId);
    Optional<Endereco> findByIdAndClienteId(Long id, Long clienteId);
}
