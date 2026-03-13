package com.hustle.repository;

import com.hustle.entity.Campaign;
import com.hustle.enums.CampaignStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByCampaignStatus(CampaignStatus campaignStatus);
    List<Campaign> findByCampaignStatusAndEndsAtBefore(CampaignStatus campaignStatus, LocalDateTime time);
}