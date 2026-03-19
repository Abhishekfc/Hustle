package com.hustle.service;

import com.hustle.entity.Submission;
import com.hustle.enums.Platform;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class ViewFetchService {

    @Value("${hustle.youtube.api-key:}")
    private String youtubeApiKey;

    @Value("${hustle.youtube.daily-quota-limit:8000}")
    private int dailyQuotaLimit;

    @Value("${hustle.youtube.manual-refresh-only:false}")
    private boolean manualRefreshOnly;

    private final AtomicInteger quotaUsedToday = new AtomicInteger(0);
    private final AtomicReference<LocalDate> quotaDate = new AtomicReference<>(LocalDate.now());

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    // Reset quota counter at midnight
    @Scheduled(cron = "0 0 0 * * *")
    public void resetDailyQuota() {
        quotaUsedToday.set(0);
        quotaDate.set(LocalDate.now());
        log.info("YouTube API daily quota counter reset");
    }

    /**
     * Returns true if the scheduler should be skipped due to manual-refresh-only mode.
     */
    public boolean isManualRefreshOnly() {
        return manualRefreshOnly;
    }

    /**
     * Fetches the current view count for a submission's video URL.
     * Returns 0L if the platform is not yet integrated or on error.
     */
    public long fetchViews(Submission submission) {
        String videoUrl = submission.getVideoUrl();
        Platform platform = detectPlatform(videoUrl);

        try {
            return switch (platform) {
                case YOUTUBE -> fetchYouTubeViews(videoUrl);
                case TIKTOK -> {
                    // TODO: Integrate Apify actor: clockworks/tiktok-profile-scraper
                    // Manual refresh via POST /api/admin/sync-views/submission/{id}
                    // Apify run cost: ~$0.25 per 1000 results
                    log.info("TikTok view fetch not implemented — use manual refresh or Apify");
                    yield 0L;
                }
                case INSTAGRAM -> {
                    // TODO: Integrate Apify actor: apify/instagram-post-scraper
                    // Manual refresh via POST /api/admin/sync-views/submission/{id}
                    log.info("Instagram view fetch not implemented — use manual refresh or Apify");
                    yield 0L;
                }
                case X -> {
                    // TODO: Integrate X API v2 free tier (500k tweets/month)
                    // or Apify actor: apidojo/tweet-scraper
                    log.info("X view fetch not implemented — use manual refresh or Apify");
                    yield 0L;
                }
            };
        } catch (Exception e) {
            log.warn("Failed to fetch views for submission {} ({}): {}", submission.getId(), videoUrl, e.getMessage());
            return 0L;
        }
    }

    // ─────────────────────── YouTube ───────────────────────

    private long fetchYouTubeViews(String videoUrl) throws Exception {
        // Check quota
        if (!canMakeApiCall()) {
            log.warn("YouTube daily quota exhausted ({}/{}) — skipping view fetch for {}",
                    quotaUsedToday.get(), dailyQuotaLimit, videoUrl);
            return 0L;
        }

        if (youtubeApiKey == null || youtubeApiKey.isBlank()) {
            log.warn("YouTube API key not configured — falling back to HTML scraping");
            return fetchYouTubeViewsHtml(videoUrl);
        }
        return fetchYouTubeViewsApi(videoUrl);
    }

    private long fetchYouTubeViewsApi(String videoUrl) throws Exception {
        String videoId = extractYouTubeVideoId(videoUrl);
        if (videoId == null) {
            log.warn("Could not extract YouTube video ID from: {}", videoUrl);
            return 0L;
        }

        String url = "https://www.googleapis.com/youtube/v3/videos?part=statistics&id="
                + videoId + "&key=" + youtubeApiKey;

        log.info("YouTube API views fetch for videoId={}", videoId);
        String body = get(url);
        quotaUsedToday.incrementAndGet();

        // Check for empty items (private / not found)
        if (body.contains("\"items\": []") || body.contains("\"items\":[]")) {
            log.info("YouTube API: video {} not found or private — returning 0", videoId);
            return 0L;
        }

        Pattern p = Pattern.compile("\"viewCount\"\\s*:\\s*\"(\\d+)\"");
        Matcher m = p.matcher(body);
        if (m.find()) {
            long views = Long.parseLong(m.group(1));
            log.info("YouTube API: videoId={} views={}", videoId, views);
            return views;
        }
        log.warn("YouTube API: viewCount not found in response for videoId={}", videoId);
        return 0L;
    }

    private long fetchYouTubeViewsHtml(String videoUrl) throws Exception {
        String videoId = extractYouTubeVideoId(videoUrl);
        if (videoId == null) {
            log.warn("Could not extract YouTube video ID from: {}", videoUrl);
            return 0L;
        }

        String watchUrl = "https://www.youtube.com/watch?v=" + videoId;
        log.info("HTML scraping YouTube views: {}", watchUrl);
        String html = get(watchUrl);

        // Private video check
        if (html.contains("\"isPrivate\":true") || html.contains("This video is private")) {
            log.info("YouTube: video {} is private — returning 0", videoId);
            return 0L;
        }

        // Pattern 1: compact JSON
        Matcher m = Pattern.compile("\"viewCount\":\"(\\d+)\"").matcher(html);
        if (m.find()) return Long.parseLong(m.group(1));

        // Pattern 2: formatted view count
        m = Pattern.compile("\"simpleText\":\"([\\d,]+) view").matcher(html);
        if (m.find()) return Long.parseLong(m.group(1).replace(",", ""));

        // Pattern 3: Shorts / interactionCount
        m = Pattern.compile("\"interactionCount\":\"(\\d+)\"").matcher(html);
        if (m.find()) return Long.parseLong(m.group(1));

        log.warn("HTML scraping: could not extract view count for videoId={}", videoId);
        return 0L;
    }

    // ─────────────────────── Quota guard ───────────────────────

    private boolean canMakeApiCall() {
        // Reset if date changed
        LocalDate today = LocalDate.now();
        if (!today.equals(quotaDate.get())) {
            quotaUsedToday.set(0);
            quotaDate.set(today);
        }
        return quotaUsedToday.get() < dailyQuotaLimit;
    }

    public int getQuotaUsedToday() {
        return quotaUsedToday.get();
    }

    // ─────────────────────── URL helpers ───────────────────────

    private Platform detectPlatform(String url) {
        if (url == null) return Platform.YOUTUBE;
        String lower = url.toLowerCase();
        if (lower.contains("youtube.com") || lower.contains("youtu.be")) return Platform.YOUTUBE;
        if (lower.contains("tiktok.com")) return Platform.TIKTOK;
        if (lower.contains("instagram.com")) return Platform.INSTAGRAM;
        if (lower.contains("twitter.com") || lower.contains("x.com")) return Platform.X;
        return Platform.YOUTUBE;
    }

    /**
     * Extracts the YouTube video ID from various URL formats.
     */
    public String extractYouTubeVideoId(String url) {
        if (url == null) return null;

        // youtu.be/VIDEO_ID
        Matcher m = Pattern.compile("youtu\\.be/([a-zA-Z0-9_-]{11})").matcher(url);
        if (m.find()) return m.group(1);

        // youtube.com/watch?v=VIDEO_ID
        m = Pattern.compile("[?&]v=([a-zA-Z0-9_-]{11})").matcher(url);
        if (m.find()) return m.group(1);

        // youtube.com/shorts/VIDEO_ID
        m = Pattern.compile("shorts/([a-zA-Z0-9_-]{11})").matcher(url);
        if (m.find()) return m.group(1);

        return null;
    }

    // ─────────────────────── HTTP util ───────────────────────

    private String get(String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", "Mozilla/5.0 (compatible; HustleBot/1.0)")
                .timeout(Duration.ofSeconds(15))
                .GET()
                .build();
        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 400) {
            throw new RuntimeException("HTTP " + res.statusCode() + " from " + url);
        }
        return res.body();
    }
}
