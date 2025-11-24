package com.app.aka.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CartErrorMessageDto {
    private String type;      // PRODUCT_NOT_FOUND
    private String message;   //"해당 상품은 마트에 등록되어 있지 않은 상품입니다."
}
