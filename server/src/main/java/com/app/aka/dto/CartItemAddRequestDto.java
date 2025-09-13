package com.app.aka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemAddRequestDto {
    private Long storeId;
    private Long cartNumber;
    private List<String> productList;
}