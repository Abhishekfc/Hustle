package com.hustle.scheduler;

import com.hustle.entity.*;
import com.hustle.enums.CampaignStatus;
import com.hustle.enums.PayoutStatus;
import com.hustle.enums.SubmissionStatus;
import com.hustle.repository.*;
import com.hustle.service.ViewFetchService;
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
    private final ViewFetchService viewFetchService;

    @Scheduled(fixedRate = 21_600_000) // every 6 hours
    @Transactional
    public void syncViewsAndProcessCampaigns() {
        if (viewFetchService.isManualRefreshOnly()) {
            log.info("CampaignScheduler: manual-refresh-only mode — skipping automatic sync");
            return;
        }

        log.info("CampaignScheduler: starting sync");

        List<Campaign> activeCampaigns = campaignRepository.findByCampaignStatus(CampaignStatus.ACTIVE);

        for (Campaign campaign : activeCampaigns) {
            List<Submission> eligibleSubmissions = submissionRepository
                    .findByCampaignIdAndStatus(campaign.getId(), SubmissionStatus.ELIGIBLE);

            // 1. Sync views from platform API
            for (Submission submission : eligibleSubmissions) {
                try {
                    long latestViews = viewFetchService.fetchViews(submission);
                    if (latestViews == 0L && submission.getViewCount() == 0L) {
                        // No data yet — skip to avoid resetting anything
                        continue;
                    }
                    applyViewUpdate(submission, latestViews);
                } catch (Exception e) {
                    log.warn("Error syncing submission {}: {}", submission.getId(), e.getMessage());
                }
            }

            // 2. Recalculate budgetUsed
            BigDecimal totalBudgetUsed = BigDecimal.ZERO;
            for (Submission submission : eligibleSubmissions) {
                BigDecimal cost = BigDecimal.valueOf(submission.getViewCount())
                        .divide(BigDecimal.valueOf(1_000_000), 10, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(campaign.getRatePerMillion()));
                totalBudgetUsed = totalBudgetUsed.add(cost);
            }
            campaign.setBudgetUsed(totalBudgetUsed);
            campaignRepository.save(campaign);

            // 3. End campaign if expired or budget exhausted
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

    /**
     * Called by the scheduler and by the manual sync endpoint.
     * Applies a new view count to a submission and updates user totals.
     */
    @Transactional
    public void applyViewUpdate(Submission submission, long latestViews) {
        long delta = latestViews - submission.getViewCount();
        if (delta == 0) return;

        submission.setViewCount(latestViews);
        submission.setLastSyncedAt(LocalDateTime.now());
        submissionRepository.save(submission);

        User user = submission.getUser();
        long newTotal = Math.max(0, user.getTotalViewsGenerated() + delta);
        user.setTotalViewsGenerated(newTotal);
        userRepository.save(user);

        log.info("Submission {}: viewCount {} → {} (delta {})",
                submission.getId(), latestViews - delta, latestViews, delta);
    }

    private void endCampaign(Campaign campaign, List<Submission> eligibleSubmissions) {
        campaign.setCampaignStatus(CampaignStatus.ENDED);
        campaignRepository.save(campaign);

        for (Submission submission : eligibleSubmissions) {
            long views = submission.getViewCount();

            BigDecimal earnings = BigDecimal.valueOf(views)
                    .divide(BigDecimal.valueOf(1_000_000), 10, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(campaign.getRatePerMillion()));

            Earnings earningsRecord = new Earnings();
            earningsRecord.setUser(submission.getUser());
            earningsRecord.setCampaign(campaign);
            earningsRecord.setSubmission(submission);
            earningsRecord.setViewsAtPayout(views);
            earningsRecord.setAmount(earnings);
            earningsRecord.setPayoutStatus(PayoutStatus.PENDING);
            earningsRepository.save(earningsRecord);

            log.info("PENDING earnings created — user: {}, submission: {}, amount: {}",
                    submission.getUser().getId(), submission.getId(), earnings);
        }

        log.info("Campaign {} ended. {} earnings records created.",
                campaign.getId(), eligibleSubmissions.size());
    }
}
