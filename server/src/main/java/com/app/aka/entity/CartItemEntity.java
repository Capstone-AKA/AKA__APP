package com.app.aka.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cart_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private CartEntity cart;

    @Column(name = "cart_id")
    private Long cartId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private ProductEntity product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false) // 장바구니에 담을 당시의 단품 가격
    private Integer unitPrice;

    @Column(name = "total_price", nullable = false) // 이 항목의 총 가격 (unitPrice * quantity)
    private Integer totalPrice;
}
