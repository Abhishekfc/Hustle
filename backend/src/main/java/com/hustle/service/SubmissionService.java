package com.hustle.service;

import com.hustle.entity.*;
import com.hustle.enums.PayoutStatus;
import com.hustle.enums.SubmissionStatus;
import com.hustle.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final CampaignRepository campaignRepository;
    private final ConnectedAccountRepository accountRepository;
    private final UserRepository userRepository;
    private final EarningsRepository earningsRepository;
    private final WalletRepository walletRepository;

    public Submission submit(Long userId, Long campaignId, Long accountId, String videoUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        ConnectedAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        Submission submission = new Submission();
        submission.setUser(user);
        submission.setCampaign(campaign);
        submission.setAccount(account);
        submission.setVideoUrl(videoUrl);
        submission.setStatus(SubmissionStatus.PENDING);
        submission.setEarningsVisible(false);
        submission.setViewCount(0L);
        submission.setSubmittedAt(LocalDateTime.now());
        return submissionRepository.save(submission);
    }

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

        submission.setStatus(SubmissionStatus.REJECTED);
        submission.setEarningsVisible(false);
        submissionRepository.save(submission);

        // Void earnings if they exist — wallet is never touched
        earningsRepository.findBySubmissionId(submissionId).ifPresent(earnings -> {
            earnings.setPayoutStatus(PayoutStatus.VOIDED);
            earningsRepository.save(earnings);
        });
    }

    public void deleteSubmission(Long submissionId) {
        submissionRepository.deleteById(submissionId);
    }
}