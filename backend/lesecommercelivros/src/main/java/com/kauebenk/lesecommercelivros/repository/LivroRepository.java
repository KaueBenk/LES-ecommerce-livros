package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.Livro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LivroRepository extends JpaRepository<Livro, Long> {
    Optional<Livro> findByIsbn(String isbn);
    Optional<Livro> findByCodigoBarras(String codigoBarras);
    List<Livro> findByAtivoTrue();

    @Query("""
            select distinct l
            from Livro l
            left join l.categorias c
            where (coalesce(:titulo, '') = '' or lower(l.titulo) like concat('%', lower(cast(:titulo as string)), '%'))
              and (:autorId is null or l.autor.id = :autorId)
              and (:categoriaId is null or c.id = :categoriaId)
              and (:ano is null or l.ano = :ano)
              and (:isbn is null or l.isbn = :isbn)
              and (:ativo is null or l.ativo = :ativo)
            """)
    Page<Livro> search(
            @Param("titulo") String titulo,
            @Param("autorId") Long autorId,
            @Param("categoriaId") Long categoriaId,
            @Param("ano") Integer ano,
            @Param("isbn") String isbn,
            @Param("ativo") Boolean ativo,
            Pageable pageable
    );
}
