package com.hustle.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class WithdrawalRequest {
    private BigDecimal amount;
    private String paymentMethod;
    private String paymentDetails;
}