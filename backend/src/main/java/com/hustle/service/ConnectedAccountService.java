package com.hustle.service;

import com.hustle.entity.ConnectedAccount;
import com.hustle.entity.User;
import com.hustle.enums.VerificationStatus;
import com.hustle.repository.ConnectedAccountRepository;
import com.hustle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConnectedAccountService {

    private final ConnectedAccountRepository accountRepository;
    private final UserRepository userRepository;
    private final VerificationService verificationService;

    private static final Random random = new Random();

    private String extractHandleFromUrl(String profileUrl) {
        if (profileUrl == null || profileUrl.isBlank()) return "";
        // @handle pattern (YouTube, TikTok, Instagram, X all support this)
        Matcher m = Pattern.compile("/@([^/?&#]+)").matcher(profileUrl);
        if (m.find()) return "@" + m.group(1);
        // /channel/ID or /c/name
        m = Pattern.compile("/(?:channel|c)/([^/?&#]+)").matcher(profileUrl);
        if (m.find()) return m.group(1);
        // fallback: last path segment
        m = Pattern.compile("/([^/?&#]+)$").matcher(profileUrl);
        if (m.find()) return m.group(1);
        return profileUrl;
    }

    private String generateVerificationCode() {
        int number = 1000 + random.nextInt(9000); // 1000–9999
        return "HUSTLE-" + number;
    }

    public List<ConnectedAccount> getAccountByUser(Long userId) {
        return accountRepository.findByUserId(userId);
    }

    public ConnectedAccount connectAccount(Long userId, ConnectedAccount account) {
        if (accountRepository.countByUserId(userId) >= 8) {
            throw new RuntimeException("Maximum 8 connected accounts are allowed");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (accountRepository.existsByUserIdAndPlatformAndProfileUrl(userId, account.getPlatform(), account.getProfileUrl())) {
            throw new RuntimeException("You have already connected this account.");
        }

        account.setUser(user);
        account.setHandle(extractHandleFromUrl(account.getProfileUrl()));
        account.setVerificationCode(generateVerificationCode());
        account.setVerificationCodeGeneratedAt(LocalDateTime.now());
        account.setVerificationStatus(VerificationStatus.PENDING);
        account.setConnectedAt(LocalDateTime.now());
        return accountRepository.save(account);
    }

    public ConnectedAccount verifyAccount(Long accountId) {
        ConnectedAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        // Check expiry (10 minutes)
        LocalDateTime generatedAt = account.getVerificationCodeGeneratedAt();
        if (generatedAt == null || generatedAt.isBefore(LocalDateTime.now().minusMinutes(10))) {
            throw new IllegalArgumentException(
                    "Verification code expired. Please generate a new code by reconnecting your account.");
        }

        boolean verified = verificationService.verifyBio(account);
        if (!verified) {
            throw new IllegalArgumentException(
                    "Verification code not found in your bio. Make sure '" +
                    account.getVerificationCode() + "' is in your profile bio and try again.");
        }

        account.setVerificationStatus(VerificationStatus.VERIFIED);
        account.setVerifiedAt(LocalDateTime.now());
        account.setLastCheckedAt(LocalDateTime.now());
        return accountRepository.save(account);
    }

    public ConnectedAccount regenerateCode(Long accountId) {
        ConnectedAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        account.setVerificationCode(generateVerificationCode());
        account.setVerificationCodeGeneratedAt(LocalDateTime.now());
        account.setVerificationStatus(VerificationStatus.PENDING);
        log.info("Regenerated verification code for account {}: {}", accountId, account.getVerificationCode());
        return accountRepository.save(account);
    }

    public void deleteAccount(Long accountId) {
        accountRepository.deleteById(accountId);
    }
}
