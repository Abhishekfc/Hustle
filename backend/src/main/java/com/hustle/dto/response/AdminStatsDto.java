package com.hustle.dto.response;

import java.math.BigDecimal;

public record AdminStatsDto(
        long totalCreators,
        long totalCampaigns,
        long activeCampaigns,
        long totalSubmissions,
        long pendingSubmissions,
        long eligibleSubmissions,
        BigDecimal totalEarnings,
        BigDecimal pendingPayouts,
        long totalViews
) {}
