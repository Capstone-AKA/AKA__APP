package com.app.aka.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "cart_id", nullable = false)
    private Long cartId;

    @Column(nullable = false)
    private Integer amount;

    @Column(nullable = false)
    private String method = "KAKAOPAY";

    @Column(nullable = false)
    private String status = "SUCCESS";

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;
}
