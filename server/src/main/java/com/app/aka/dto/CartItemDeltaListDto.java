package com.app.aka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CartItemDeltaListDto {
    private Long cartNumber;
    private List<CartItemResponseDto> items;
    private Integer newTotalAmount;
}
