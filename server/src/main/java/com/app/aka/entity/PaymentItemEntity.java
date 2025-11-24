package com.app.aka.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payment_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 영수증(payment)의 ID
    @Column(nullable = false)
    private Long paymentId;

    private String productName;
    private Integer quantity;
    private Integer totalPrice;
}
