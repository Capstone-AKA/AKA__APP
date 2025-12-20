package com.app.aka.dto;

import lombok.Data;

@Data
public class CartEnterRequestDto {
    private Long userId;
    private Long storeId;
}
