package com.app.aka.repository;

import com.app.aka.entity.CartEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<CartEntity, Long> {
    Optional<CartEntity> findByStoreIdAndCartNumber(Long storeId, Long cartNumber);
    Optional<CartEntity> findByCartNumber(Long cartNumber);
    Optional<CartEntity> findByUserId(Long userId);
}
