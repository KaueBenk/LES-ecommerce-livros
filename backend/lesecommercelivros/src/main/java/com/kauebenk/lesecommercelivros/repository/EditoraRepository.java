package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.Editora;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EditoraRepository extends JpaRepository<Editora, Long> {
}
