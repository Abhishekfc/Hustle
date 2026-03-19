package com.hustle.entity;

import com.hustle.enums.CampaignStatus;
import com.hustle.enums.Category;
import com.hustle.enums.Platform;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "campaigns")
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String instructionsUrl;

    @Column(length = 500)
    private String thumbnailUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalBudget;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal budgetUsed = BigDecimal.ZERO;


    @Column(nullable = false, precision = 10, scale = 2)
    private long ratePerMillion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CampaignStatus campaignStatus = CampaignStatus.ACTIVE;

    private LocalDateTime endsAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private boolean distributed = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "campaign_allowed_platforms", joinColumns = @JoinColumn(name = "campaign_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "platform")
    private List<Platform> platforms = new ArrayList<>();

}
