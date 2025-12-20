package com.app.aka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptResponseDto {
    private Long receiptId;       // 결제 id
    private LocalDateTime issuedAt;
    private String paymentMethod; // 카카오페이
    private Integer amount;
    private Long userId;
    private Long cartId;
    private List<ReceiptItemDto> items;
}