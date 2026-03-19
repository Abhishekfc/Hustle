package com.hustle.service;

import com.hustle.entity.*;
import com.hustle.enums.Platform;
import com.hustle.enums.PayoutStatus;
import com.hustle.enums.SubmissionStatus;
import com.hustle.enums.VerificationStatus;
import com.hustle.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final CampaignRepository campaignRepository;
    private final ConnectedAccountRepository accountRepository;
    private final UserRepository userRepository;
    private final EarningsRepository earningsRepository;
    private final WalletRepository walletRepository;
    private final ViewFetchService viewFetchService;

    @Value("${hustle.youtube.api-key:}")
    private String youtubeApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    public Submission submit(Long userId, Long campaignId, Long accountId, String videoUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        ConnectedAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Connected account not found. Please connect and verify your account first."));

        if (!account.getUser().getId().equals(userId)) {
            throw new RuntimeException("This account does not belong to you.");
        }
        if (account.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new RuntimeException("Account is not verified. Please verify your account before submitting.");
        }

        // Video URL must match the account's platform
        Platform urlPlatform = detectPlatform(videoUrl);
        if (urlPlatform != account.getPlatform()) {
            throw new RuntimeException(
                "Video URL is from " + urlPlatform.name() +
                " but your selected account is a " + account.getPlatform().name() + " account.");
        }

        // Video must belong to the connected account's channel
        verifyChannelOwnership(account, videoUrl);

        if (submissionRepository.existsByUserIdAndCampaignId(userId, campaignId)) {
            throw new RuntimeException("You have already submitted a video for this campaign.");
        }
        if (submissionRepository.existsByVideoUrl(videoUrl)) {
            throw new RuntimeException("This video has already been submitted.");
        }

        Submission submission = new Submission();
        submission.setUser(user);
        submission.setCampaign(campaign);
        submission.setAccount(account);
        submission.setVideoUrl(videoUrl);
        submission.setStatus(SubmissionStatus.PENDING);
        submission.setViewCount(0L);
        submission.setSubmittedAt(LocalDateTime.now());
        return submissionRepository.save(submission);
    }

    // ── Channel ownership verification ──────────────────────────────────────

    private void verifyChannelOwnership(ConnectedAccount account, String videoUrl) {
        try {
            switch (account.getPlatform()) {
                case YOUTUBE -> verifyYouTubeOwnership(account, videoUrl);
                case TIKTOK -> {
                    // TODO: Verify via Apify actor when integrated
                    log.info("TikTok channel ownership check skipped — pending Apify integration");
                }
                case INSTAGRAM -> {
                    // TODO: Verify via Apify actor when integrated
                    log.info("Instagram channel ownership check skipped — pending Apify integration");
                }
                case X -> {
                    // TODO: Verify via X API v2 when integrated
                    log.info("X channel ownership check skipped — pending API integration");
                }
            }
        } catch (RuntimeException e) {
            throw e; // re-throw validation errors
        } catch (Exception e) {
            log.warn("Channel ownership check failed with unexpected error: {}", e.getMessage());
            // Don't block submission if API is temporarily unavailable
        }
    }

    private void verifyYouTubeOwnership(ConnectedAccount account, String videoUrl) throws Exception {
        if (youtubeApiKey == null || youtubeApiKey.isBlank()) {
            log.warn("YouTube API key not configured — skipping channel ownership check");
            return;
        }

        String videoChannelId = getVideoChannelId(videoUrl);
        if (videoChannelId == null) {
            throw new RuntimeException("Could not verify the video. Make sure the video is public and the URL is correct.");
        }

        String accountChannelId = getAccountChannelId(account.getProfileUrl());
        if (accountChannelId == null) {
            log.warn("Could not resolve channel ID for account {} — skipping ownership check", account.getId());
            return;
        }

        if (!videoChannelId.equals(accountChannelId)) {
            throw new RuntimeException(
                "This video does not belong to your connected YouTube channel. " +
                "You can only submit videos from your own channel.");
        }

        log.info("YouTube channel ownership verified for account {}", account.getId());
    }

    /** Returns the channelId of the YouTube video's uploader. */
    private String getVideoChannelId(String videoUrl) throws Exception {
        String videoId = viewFetchService.extractYouTubeVideoId(videoUrl);
        if (videoId == null) throw new RuntimeException("Invalid YouTube video URL.");

        String url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&id="
                + videoId + "&key=" + youtubeApiKey;
        String body = get(url);

        if (body.contains("\"items\": []") || body.contains("\"items\":[]")) {
            return null; // private or not found
        }

        Matcher m = Pattern.compile("\"channelId\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
        return m.find() ? m.group(1) : null;
    }

    /** Returns the channelId of the connected account's YouTube channel. */
    private String getAccountChannelId(String profileUrl) throws Exception {
        String param = extractYouTubeParam(profileUrl);

        // Already a channel ID
        if (param.startsWith("UC") || param.startsWith("HC")) return param;

        String handle = param.startsWith("@") ? param : "@" + param;
        String url = "https://www.googleapis.com/youtube/v3/channels?part=id&forHandle="
                + handle + "&key=" + youtubeApiKey;
        String body = get(url);

        Matcher m = Pattern.compile("\"id\"\\s*:\\s*\"(UC[^\"]+)\"").matcher(body);
        return m.find() ? m.group(1) : null;
    }

    private String extractYouTubeParam(String profileUrl) {
        Matcher m = Pattern.compile("youtube\\.com/@([^/?&#]+)").matcher(profileUrl);
        if (m.find()) return "@" + m.group(1);
        m = Pattern.compile("youtube\\.com/channel/([^/?&#]+)").matcher(profileUrl);
        if (m.find()) return m.group(1);
        m = Pattern.compile("youtube\\.com/c/([^/?&#]+)").matcher(profileUrl);
        if (m.find()) return m.group(1);
        return profileUrl;
    }

    private String get(String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "Mozilla/5.0")
                .timeout(Duration.ofSeconds(10))
                .GET().build();
        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 400) throw new RuntimeException("HTTP " + res.statusCode());
        return res.body();
    }

    // ── Platform detection ───────────────────────────────────────────────────

    private Platform detectPlatform(String url) {
        if (url == null) throw new RuntimeException("Video URL is required.");
        String lower = url.toLowerCase();
        if (lower.contains("youtube.com") || lower.contains("youtu.be")) return Platform.YOUTUBE;
        if (lower.contains("tiktok.com")) return Platform.TIKTOK;
        if (lower.contains("instagram.com")) return Platform.INSTAGRAM;
        if (lower.contains("twitter.com") || lower.contains("x.com")) return Platform.X;
        throw new RuntimeException("Unsupported platform URL. Use YouTube, TikTok, Instagram, or X.");
    }

    // ── Remaining service methods ────────────────────────────────────────────

    public List<Submission> getSubmissionsByUser(Long userId) {
        return submissionRepository.findByUserId(userId);
    }

    public List<Submission> getSubmissionsByUserAndCampaign(Long userId, Long campaignId) {
        return submissionRepository.findByUserIdAndCampaignId(userId, campaignId);
    }

    public List<Submission> getSubmissionsByCampaign(Long campaignId) {
        return submissionRepository.findByCampaignId(campaignId);
    }

    public List<Submission> getAllSubmissions() {
        return submissionRepository.findAll();
    }

    @Transactional
    public void markEligible(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        submission.setStatus(SubmissionStatus.ELIGIBLE);
        submissionRepository.save(submission);
    }

    @Transactional
    public void rejectSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        long views = submission.getViewCount();
        if (views > 0) {
            User user = submission.getUser();
            user.setTotalViewsGenerated(Math.max(0, user.getTotalViewsGenerated() - views));
            userRepository.save(user);
        }

        submission.setStatus(SubmissionStatus.REJECTED);
        submissionRepository.save(submission);

        earningsRepository.findBySubmissionId(submissionId).ifPresent(earnings -> {
            earnings.setPayoutStatus(PayoutStatus.VOIDED);
            earningsRepository.save(earnings);
        });
    }

    @Transactional
    public Submission updateViewCount(Long submissionId, long newViews) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        long delta = newViews - submission.getViewCount();
        submission.setViewCount(newViews);
        submission.setLastSyncedAt(LocalDateTime.now());
        submissionRepository.save(submission);

        if (delta != 0) {
            User user = submission.getUser();
            user.setTotalViewsGenerated(Math.max(0, user.getTotalViewsGenerated() + delta));
            userRepository.save(user);
        }

        Campaign campaign = submission.getCampaign();
        if (campaign != null) {
            BigDecimal totalBudgetUsed = BigDecimal.ZERO;
            for (Submission s : submissionRepository.findByCampaignIdAndStatus(
                    campaign.getId(), SubmissionStatus.ELIGIBLE)) {
                totalBudgetUsed = totalBudgetUsed.add(
                        BigDecimal.valueOf(s.getViewCount())
                                .divide(BigDecimal.valueOf(1_000_000), 10, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(campaign.getRatePerMillion()))
                );
            }
            campaign.setBudgetUsed(totalBudgetUsed);
            campaignRepository.save(campaign);
        }

        return submission;
    }

    @Transactional
    public void deleteSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        long views = submission.getViewCount();
        if (views > 0) {
            User user = submission.getUser();
            user.setTotalViewsGenerated(Math.max(0, user.getTotalViewsGenerated() - views));
            userRepository.save(user);
        }

        earningsRepository.findBySubmissionId(submissionId).ifPresent(earningsRepository::delete);
        submissionRepository.delete(submission);
    }
}
