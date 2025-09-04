package com.app.aka.repository;

import com.app.aka.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {
    // 상품명을 기준으로 조회
    Optional<ProductEntity> findByName(String name);
    //필요하면 이미지 식별자
    Optional<ProductEntity> findByImageIdentifier(String imageIdentifier);
}
