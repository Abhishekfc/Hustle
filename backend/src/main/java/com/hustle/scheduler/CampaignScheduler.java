package com.hustle.scheduler;

import com.hustle.entity.*;
import com.hustle.enums.CampaignStatus;
import com.hustle.enums.PayoutStatus;
import com.hustle.enums.SubmissionStatus;
import com.hustle.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CampaignScheduler {

    private final CampaignRepository campaignRepository;
    private final SubmissionRepository submissionRepository;
    private final EarningsRepository earningsRepository;
    private final UserRepository userRepository;

    @Scheduled(fixedRate = 300000) // every 6 hours 30000 6 * 60 * 60 * 1000
    @Transactional
    public void syncViewsAndProcessCampaigns() {
        log.info("CampaignScheduler: starting sync");

        List<Campaign> activeCampaigns = campaignRepository.findByCampaignStatus(CampaignStatus.ACTIVE);

        for (Campaign campaign : activeCampaigns) {

            // 1. Get all eligible submissions for this campaign
            List<Submission> eligibleSubmissions = submissionRepository
                    .findByCampaignIdAndStatus(campaign.getId(), SubmissionStatus.ELIGIBLE);

            // 2. Sync views (placeholder until real API integration)
            for (Submission submission : eligibleSubmissions) {
                // TODO: replace with real platform API call
                // long latestViews = socialApiService.getViews(submission.getVideoUrl());
                long latestViews = submission.getViewCount(); // no-op until API integrated

                long delta = latestViews - submission.getViewCount();
                if (delta > 0) {
                    submission.setViewCount(latestViews);
                    submissionRepository.save(submission);

                    User user = submission.getUser();
                    user.setTotalViewsGenerated(user.getTotalViewsGenerated() + delta);
                    userRepository.save(user);

                    log.info("Submission {}: +{} views", submission.getId(), delta);
                }
            }

            // 3. Recalculate budgetUsed based on current view counts
            BigDecimal totalBudgetUsed = BigDecimal.ZERO;
            for (Submission submission : eligibleSubmissions) {
                BigDecimal cost = BigDecimal.valueOf(submission.getViewCount())
                        .divide(BigDecimal.valueOf(1_000_000), 10, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(campaign.getRatePerMillion()));
                totalBudgetUsed = totalBudgetUsed.add(cost);
            }
            campaign.setBudgetUsed(totalBudgetUsed);
            campaignRepository.save(campaign);

            // 4. Check if campaign should end
            boolean expired = campaign.getEndsAt() != null
                    && LocalDateTime.now().isAfter(campaign.getEndsAt());
            boolean budgetExhausted = totalBudgetUsed.compareTo(campaign.getTotalBudget()) >= 0;

            if (expired || budgetExhausted) {
                log.info("Ending campaign {} — expired: {}, budgetExhausted: {}",
                        campaign.getId(), expired, budgetExhausted);
                endCampaign(campaign, eligibleSubmissions);
            }
        }

        log.info("CampaignScheduler: sync complete");
    }

    private void endCampaign(Campaign campaign, List<Submission> eligibleSubmissions) {
        campaign.setCampaignStatus(CampaignStatus.ENDED);
        campaignRepository.save(campaign);

        for (Submission submission : eligibleSubmissions) {
            long views = submission.getViewCount();
            if (views <= 0) continue;

            BigDecimal earnings = BigDecimal.valueOf(views)
                    .divide(BigDecimal.valueOf(1_000_000), 10, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(campaign.getRatePerMillion()));

            // Create PENDING earnings — wallet NOT touched
            // Admin manually pays out via POST /api/wallet/admin/earnings/{id}/payout
            Earnings earningsRecord = new Earnings();
            earningsRecord.setUser(submission.getUser());
            earningsRecord.setCampaign(campaign);
            earningsRecord.setSubmission(submission);
            earningsRecord.setViewsAtPayout(views);
            earningsRecord.setAmount(earnings);
            earningsRecord.setPayoutStatus(PayoutStatus.PENDING);
            earningsRepository.save(earningsRecord);

            // Show creator that campaign ended and payment is processing
            submission.setEarningsVisible(true);
            submissionRepository.save(submission);

            log.info("PENDING earnings created — user: {}, submission: {}, amount: {}",
                    submission.getUser().getId(), submission.getId(), earnings);
        }

        log.info("Campaign {} ended. {} earnings records pending admin payout.",
                campaign.getId(), eligibleSubmissions.size());
    }
}