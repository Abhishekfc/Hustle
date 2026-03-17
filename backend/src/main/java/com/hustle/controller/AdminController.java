package com.hustle.controller;

import com.hustle.dto.response.AdminStatsDto;
import com.hustle.dto.response.CampaignAnalyticsDto;
import com.hustle.dto.response.UserStatsDto;
import com.hustle.entity.*;
import com.hustle.enums.CampaignStatus;
import com.hustle.enums.PayoutStatus;
import com.hustle.enums.Role;
import com.hustle.enums.SubmissionStatus;
import com.hustle.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final SubmissionRepository submissionRepository;
    private final EarningsRepository earningsRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        long totalCreators = userRepository.countByRole(Role.CREATOR);
        long totalCampaigns = campaignRepository.count();
        long activeCampaigns = campaignRepository.findByCampaignStatus(CampaignStatus.ACTIVE).size();
        long totalSubmissions = submissionRepository.count();
        long pendingSubmissions = submissionRepository.countByStatus(SubmissionStatus.PENDING);
        long eligibleSubmissions = submissionRepository.countByStatus(SubmissionStatus.ELIGIBLE);

        List<Earnings> allEarnings = earningsRepository.findAll();
        BigDecimal totalEarnings = allEarnings.stream()
                .map(Earnings::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pendingPayouts = earningsRepository.findByPayoutStatus(PayoutStatus.PENDING)
                .stream()
                .map(Earnings::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalViews = submissionRepository.findAll().stream()
                .mapToLong(Submission::getViewCount)
                .sum();

        return ResponseEntity.ok(new AdminStatsDto(
                totalCreators, totalCampaigns, activeCampaigns,
                totalSubmissions, pendingSubmissions, eligibleSubmissions,
                totalEarnings, pendingPayouts, totalViews
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserStatsDto>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserStatsDto> result = users.stream().map(user -> {
            List<Submission> subs = submissionRepository.findByUserId(user.getId());
            List<Earnings> earnings = earningsRepository.findByUserId(user.getId());
            BigDecimal totalEarned = earnings.stream()
                    .filter(e -> e.getPayoutStatus() == PayoutStatus.PAID)
                    .map(Earnings::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            return new UserStatsDto(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getTotalViewsGenerated(),
                    user.getCreatedAt(),
                    subs.size(),
                    totalEarned
            );
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/campaigns/{id}/analytics")
    public ResponseEntity<CampaignAnalyticsDto> getCampaignAnalytics(@PathVariable Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + id));

        List<Submission> submissions = submissionRepository.findByCampaignId(id);
        long eligible = submissions.stream().filter(s -> s.getStatus() == SubmissionStatus.ELIGIBLE).count();
        long pending = submissions.stream().filter(s -> s.getStatus() == SubmissionStatus.PENDING).count();
        long rejected = submissions.stream().filter(s -> s.getStatus() == SubmissionStatus.REJECTED).count();
        long totalViews = submissions.stream().mapToLong(Submission::getViewCount).sum();

        List<Earnings> earnings = earningsRepository.findByCampaignId(id);

        List<CampaignAnalyticsDto.TopCreatorDto> topCreators = submissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ELIGIBLE)
                .sorted((a, b) -> Long.compare(b.getViewCount(), a.getViewCount()))
                .limit(10)
                .map(s -> {
                    BigDecimal earningsAmount = earnings.stream()
                            .filter(e -> e.getSubmission().getId().equals(s.getId()))
                            .map(Earnings::getAmount)
                            .findFirst()
                            .orElse(BigDecimal.ZERO);
                    return new CampaignAnalyticsDto.TopCreatorDto(
                            s.getUser().getUsername(),
                            s.getViewCount(),
                            earningsAmount,
                            s.getStatus().name()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(new CampaignAnalyticsDto(
                campaign.getId(),
                campaign.getTitle(),
                submissions.size(),
                eligible,
                pending,
                rejected,
                totalViews,
                campaign.getBudgetUsed(),
                campaign.getTotalBudget(),
                topCreators
        ));
    }
}
