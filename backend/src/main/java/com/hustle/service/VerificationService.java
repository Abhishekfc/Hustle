package com.hustle.service;

import com.hustle.entity.ConnectedAccount;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class VerificationService {

    @Value("${hustle.youtube.api-key:}")
    private String youtubeApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    /**
     * Verifies that the creator's bio on their platform profile contains the verification code.
     */
    public boolean verifyBio(ConnectedAccount account) {
        String code = account.getVerificationCode();
        String profileUrl = account.getProfileUrl();

        try {
            return switch (account.getPlatform()) {
                case YOUTUBE -> verifyYouTubeBio(profileUrl, code);
                case TIKTOK -> {
                    // TODO: Implement via Apify when ready
                    // Apify actor: clockworks/tiktok-profile-scraper
                    // For now return false with a helpful log message
                    log.info("TikTok verification not yet implemented — pending Apify integration");
                    yield false;
                }
                case INSTAGRAM -> {
                    // TODO: Implement via Apify when ready
                    // Instagram scraping is blocked without authenticated sessions
                    // Will use Apify actor: apify/instagram-profile-scraper
                    log.info("Instagram verification not yet implemented — pending Apify integration");
                    yield false;
                }
                case X -> {
                    // TODO: Implement via Apify when ready
                    // Will use Apify actor: apidojo/tweet-scraper or X API v2 free tier
                    log.info("X verification not yet implemented — pending Apify integration");
                    yield false;
                }
            };
        } catch (Exception e) {
            log.warn("Bio verification failed for account {}: {}", account.getId(), e.getMessage());
            return false;
        }
    }

    // ─────────────────────── YouTube ───────────────────────

    private boolean verifyYouTubeBio(String profileUrl, String code) throws Exception {
        if (youtubeApiKey == null || youtubeApiKey.isBlank()) {
            log.warn("YouTube API key not configured — falling back to HTML scraping");
            return verifyYouTubeBioHtml(profileUrl, code);
        }
        return verifyYouTubeBioApi(profileUrl, code);
    }

    private boolean verifyYouTubeBioApi(String profileUrl, String code) throws Exception {
        String param = extractYouTubeParam(profileUrl);
        String url;
        if (param.startsWith("UC") || param.startsWith("HC")) {
            url = "https://www.googleapis.com/youtube/v3/channels?part=snippet&id="
                    + param + "&key=" + youtubeApiKey;
        } else {
            // handle starts with @
            String handle = param.startsWith("@") ? param : "@" + param;
            url = "https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle="
                    + handle + "&key=" + youtubeApiKey;
        }

        log.info("YouTube API bio check: {}", url.replace(youtubeApiKey, "***"));
        String body = get(url);

        // Extract description from JSON
        Pattern p = Pattern.compile("\"description\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"");
        Matcher m = p.matcher(body);
        if (m.find()) {
            String description = unescapeJson(m.group(1));
            log.info("YouTube bio description found, checking for code '{}'", code);
            return description.contains(code);
        }
        log.warn("YouTube API: no description found in response");
        return false;
    }

    private boolean verifyYouTubeBioHtml(String profileUrl, String code) throws Exception {
        String aboutUrl = toYouTubeAboutUrl(profileUrl);
        log.info("Fetching YouTube about page: {}", aboutUrl);
        String html = get(aboutUrl);
        return html.contains(code);
    }

    // ─────────────────────── URL helpers ───────────────────────

    /**
     * Extracts the YouTube channel handle or channel ID from a profile URL.
     * Returns handle like "@piyushclips" or channel ID like "UCxxxxxx".
     */
    private String extractYouTubeParam(String profileUrl) {
        // https://youtube.com/@handle
        Matcher m = Pattern.compile("youtube\\.com/@([^/?&#]+)").matcher(profileUrl);
        if (m.find()) return "@" + m.group(1);

        // https://youtube.com/channel/UCxxxxxx
        m = Pattern.compile("youtube\\.com/channel/([^/?&#]+)").matcher(profileUrl);
        if (m.find()) return m.group(1);

        // https://youtube.com/c/channelname  (legacy custom URL)
        m = Pattern.compile("youtube\\.com/c/([^/?&#]+)").matcher(profileUrl);
        if (m.find()) return m.group(1);

        // bare handle or ID passed directly
        return profileUrl;
    }

    private String toYouTubeAboutUrl(String profileUrl) {
        // Normalise to about page
        String base = profileUrl.replaceAll("/(about|featured|videos|community|playlists).*$", "");
        if (!base.endsWith("/")) base += "/";
        return base + "about";
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

    private String unescapeJson(String s) {
        return s.replace("\\n", "\n").replace("\\r", "\r").replace("\\t", "\t")
                .replace("\\\"", "\"").replace("\\\\", "\\");
    }
}
