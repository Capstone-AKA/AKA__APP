package com.app.aka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDetailResponseDto {
    private String cartCode;
    private Long userId;
    private Long storeId;
    private Integer totalAmount;
    private String status;
    private List<CartItemResponseDto> items;
}