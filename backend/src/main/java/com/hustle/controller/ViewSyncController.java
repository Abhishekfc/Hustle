package com.hustle.controller;

import com.hustle.entity.Campaign;
import com.hustle.entity.Submission;
import com.hustle.enums.CampaignStatus;
import com.hustle.enums.SubmissionStatus;
import com.hustle.repository.CampaignRepository;
import com.hustle.repository.SubmissionRepository;
import com.hustle.scheduler.CampaignScheduler;
import com.hustle.service.SubmissionService;
import com.hustle.service.ViewFetchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/sync-views")
@RequiredArgsConstructor
public class ViewSyncController {

    private final SubmissionRepository submissionRepository;
    private final CampaignRepository campaignRepository;
    private final SubmissionService submissionService;
    private final ViewFetchService viewFetchService;
    private final CampaignScheduler campaignScheduler;

    /**
     * Triggers an immediate view sync for all ELIGIBLE submissions in a campaign.
     * Only allowed for ACTIVE campaigns that have not been paid out.
     */
    @PostMapping("/campaign/{campaignId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> syncCampaignViews(@PathVariable Long campaignId) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));

        if (campaign.getCampaignStatus() != CampaignStatus.ACTIVE) {
            log.info("Skipping view sync for campaign {} — status is {}", campaignId, campaign.getCampaignStatus());
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "View sync is only allowed for ACTIVE campaigns",
                    "campaignStatus", campaign.getCampaignStatus().name()
            ));
        }

        if (campaign.isDistributed()) {
            log.info("Skipping view sync for campaign {} — already paid out", campaignId);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Earnings for this campaign have already been distributed"
            ));
        }

        List<Submission> eligible = submissionRepository
                .findByCampaignIdAndStatus(campaignId, SubmissionStatus.ELIGIBLE);

        int synced = 0;
        long totalViews = 0;

        for (Submission submission : eligible) {
            try {
                long latestViews = viewFetchService.fetchViews(submission);
                if (latestViews > 0 || submission.getViewCount() > 0) {
                    campaignScheduler.applyViewUpdate(submission, latestViews);
                    synced++;
                    totalViews += latestViews;
                }
            } catch (Exception e) {
                log.warn("Failed to sync submission {}: {}", submission.getId(), e.getMessage());
            }
        }

        log.info("Manual sync for campaign {}: {}/{} eligible submissions synced, totalViews={}",
                campaignId, synced, eligible.size(), totalViews);

        return ResponseEntity.ok(Map.of(
                "campaignId", campaignId,
                "eligibleSubmissions", eligible.size(),
                "synced", synced,
                "totalViewsAfterSync", totalViews,
                "quotaUsedToday", viewFetchService.getQuotaUsedToday()
        ));
    }

    /**
     * Manually sets the view count for a single submission.
     * Only allowed for ELIGIBLE submissions in ACTIVE campaigns.
     * Use for Instagram / TikTok until Apify is integrated.
     */
    @PutMapping("/submission/{submissionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> manualOverrideViews(
            @PathVariable Long submissionId,
            @RequestBody Map<String, Long> body) {

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        if (submission.getStatus() != SubmissionStatus.ELIGIBLE) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "View override is only allowed for ELIGIBLE submissions",
                    "currentStatus", submission.getStatus().name()
            ));
        }

        Campaign campaign = submission.getCampaign();
        if (campaign.getCampaignStatus() != CampaignStatus.ACTIVE) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "View override is only allowed for submissions in ACTIVE campaigns",
                    "campaignStatus", campaign.getCampaignStatus().name()
            ));
        }

        if (campaign.isDistributed()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Earnings for this campaign have already been distributed"
            ));
        }

        long viewCount = body.get("viewCount");
        log.info("Manual view override: submission {} → {} views", submissionId, viewCount);
        Submission updated = submissionService.updateViewCount(submissionId, viewCount);
        return ResponseEntity.ok(updated);
    }
}
