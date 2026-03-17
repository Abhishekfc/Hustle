package com.hustle.repository;

import com.hustle.entity.Earnings;
import com.hustle.enums.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EarningsRepository extends JpaRepository<Earnings, Long> {
    List<Earnings> findByUserId(Long userId);
    List<Earnings> findByCampaignIdAndPayoutStatus(Long campaignId, PayoutStatus status);
    Optional<Earnings> findBySubmissionId(Long submissionId);
    List<Earnings> findByCampaignId(Long campaignId);
    List<Earnings> findByPayoutStatus(PayoutStatus status);
}