package com.kauebenk.lesecommercelivros.repository;

import com.kauebenk.lesecommercelivros.entity.ItemTroca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemTrocaRepository extends JpaRepository<ItemTroca, Long> {
}
