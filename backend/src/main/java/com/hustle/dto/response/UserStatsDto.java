package com.hustle.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserStatsDto(
        Long id,
        String username,
        String email,
        String role,
        Long totalViewsGenerated,
        LocalDateTime createdAt,
        int submissionCount,
        BigDecimal totalEarned
) {}
