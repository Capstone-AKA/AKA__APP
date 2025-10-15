package com.app.aka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentHistoryDto {
    private Long receiptId;        // 결제 ID
    private LocalDateTime issuedAt;
    private String paymentMethod;  // 결제 수단
    private Integer amount;        // 결제 금액
    private Long cartId;           // 카트 번호
}
