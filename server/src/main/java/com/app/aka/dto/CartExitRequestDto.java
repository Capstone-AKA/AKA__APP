package com.app.aka.dto;

import lombok.Data;

@Data
public class CartExitRequestDto {
    private Long storeId;
    private Long cartNumber;
}
