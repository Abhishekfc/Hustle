package com.hustle.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CampaignAnalyticsDto(
        Long campaignId,
        String title,
        long totalSubmissions,
        long eligibleSubmissions,
        long pendingSubmissions,
        long rejectedSubmissions,
        long totalViews,
        BigDecimal budgetUsed,
        BigDecimal totalBudget,
        List<TopCreatorDto> topCreators
) {
    public record TopCreatorDto(
            String username,
            long viewCount,
            BigDecimal earnings,
            String status
    ) {}
}
