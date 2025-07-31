package com.app.aka.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cart")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private UserEntity user;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "store_id", nullable = false) // DB 컬럼 직접 매핑
    private Long storeId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "total_amount", nullable = false)
    private Integer totalAmount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "cart_code", unique = true, nullable = false) // QR 매칭용
    private String cartCode;

    @Column(name = "status", nullable = false) // 상태 필드 추가 (waiting, assigned, entered 등)
    private String status;

    // CartItemEntity와의 One-to-Many 관계 설정 (해당 카트에 담긴 상품 목록)
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default // @Builder 사용 시 기본값 설정을 위해 필요
    private List<CartItemEntity> cartItems = new ArrayList<>();

}
