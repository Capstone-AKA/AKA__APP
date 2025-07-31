package com.app.aka.repository;

import com.app.aka.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {
    Optional<ProductEntity> findByImageIdentifier(String imageIdentifier);
}