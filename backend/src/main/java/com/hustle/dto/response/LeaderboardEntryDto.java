package com.hustle.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class LeaderboardEntryDto {
    private int rank;
    private String username;
    private int submissionCount;
    private long totalViews;
    private BigDecimal totalEarned;
}
