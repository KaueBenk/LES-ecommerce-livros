package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.ItemCarrinho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItemCarrinhoRepository extends JpaRepository<ItemCarrinho, Long> {
    List<ItemCarrinho> findByCarrinhoId(Long carrinhoId);
    Optional<ItemCarrinho> findByIdAndCarrinhoId(Long id, Long carrinhoId);
    Optional<ItemCarrinho> findByCarrinhoIdAndLivroId(Long carrinhoId, Long livroId);
    void deleteByCarrinhoId(Long carrinhoId);

    @Modifying
    @Query("delete from ItemCarrinho i where i.carrinho.id = :carrinhoId")
    int deleteAllByCarrinhoIdQuery(@Param("carrinhoId") Long carrinhoId);
}
