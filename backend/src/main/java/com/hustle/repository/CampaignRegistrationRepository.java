package com.hustle.repository;

import com.hustle.entity.CampaignRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampaignRegistrationRepository extends JpaRepository<CampaignRegistration, Long> {
    boolean existsByUserIdAndCampaignId(Long userId, Long campaignId);
    List<CampaignRegistration> findByUserId(Long userId);
}
