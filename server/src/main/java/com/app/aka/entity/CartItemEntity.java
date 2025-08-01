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

    public void updateQuantity(int newQuantity, Integer productUnitPrice) {
        if (newQuantity <= 0) {
            throw new IllegalArgumentException("수량은 1 이상이어야 합니다.");
        }
        this.quantity = newQuantity;
        this.unitPrice = productUnitPrice != null ? productUnitPrice : this.unitPrice; // unitPrice 변경 가능성 고려
        this.totalPrice = this.unitPrice * this.quantity;
    }
}
