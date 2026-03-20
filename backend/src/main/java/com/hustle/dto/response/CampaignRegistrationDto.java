package com.hustle.dto.response;

import com.hustle.entity.Campaign;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CampaignRegistrationDto {
    private Campaign campaign;
    private LocalDateTime registeredAt;
}
