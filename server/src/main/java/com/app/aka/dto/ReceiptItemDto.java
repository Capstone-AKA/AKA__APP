package com.app.aka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class ReceiptItemDto {
    private String productName;
    private Integer quantity;
    private Integer totalPrice;
}