package com.hustle.service;


import com.hustle.dto.response.CampaignRegistrationDto;
import com.hustle.dto.response.LeaderboardEntryDto;
import com.hustle.entity.Campaign;
import com.hustle.entity.CampaignRegistration;
import com.hustle.entity.Submission;
import com.hustle.entity.User;
import com.hustle.enums.CampaignStatus;
import com.hustle.enums.SubmissionStatus;
import com.hustle.repository.CampaignRegistrationRepository;
import com.hustle.repository.CampaignRepository;
import com.hustle.repository.SubmissionRepository;
import com.hustle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final SubmissionRepository submissionRepository;
    private final CampaignRegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    public List<Campaign> getAllCampaigns(){
        return campaignRepository.findAll();
    }

    public List<Campaign> getActiveCampaigns(){
        return campaignRepository.findByCampaignStatus(CampaignStatus.ACTIVE);
    }

    public Campaign getCampaignById(Long id){
        return campaignRepository.findById(id)
                .orElseThrow(() ->  new RuntimeException("Campaign not found: " +  id));
    }

    public Campaign createCampaign(Campaign  campaign){
        return campaignRepository.save(campaign);
    }

    public Campaign updateCampaign(Long id, Campaign updated){
        Campaign existing = getCampaignById(id);
        existing.setTitle(updated.getTitle());
        existing.setCategory(updated.getCategory());
        existing.setDescription(updated.getDescription());
        existing.setInstructionsUrl(updated.getInstructionsUrl());
        existing.setThumbnailUrl(updated.getThumbnailUrl());
        existing.setTotalBudget(updated.getTotalBudget());
        existing.setRatePerMillion(updated.getRatePerMillion());
        existing.setCampaignStatus(updated.getCampaignStatus());
        existing.setEndsAt(updated.getEndsAt());
        existing.getPlatforms().clear();
        existing.getPlatforms().addAll(updated.getPlatforms());
        return campaignRepository.save(existing);
    }

    public void deleteCampaign(Long id) {
        campaignRepository.deleteById(id);
    }

    public void registerForCampaign(Long userId, Long campaignId) {
        if (registrationRepository.existsByUserIdAndCampaignId(userId, campaignId)) {
            return; // already registered, idempotent
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Campaign campaign = getCampaignById(campaignId);
        CampaignRegistration reg = new CampaignRegistration();
        reg.setUser(user);
        reg.setCampaign(campaign);
        registrationRepository.save(reg);
    }

    public boolean isRegistered(Long userId, Long campaignId) {
        return registrationRepository.existsByUserIdAndCampaignId(userId, campaignId);
    }

    public List<CampaignRegistrationDto> getMyRegistrations(Long userId) {
        return registrationRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(CampaignRegistration::getRegisteredAt).reversed())
                .map(r -> new CampaignRegistrationDto(r.getCampaign(), r.getRegisteredAt()))
                .collect(Collectors.toList());
    }

    public List<LeaderboardEntryDto> getLeaderboard(Long campaignId) {
        Campaign campaign = getCampaignById(campaignId);
        List<Submission> eligible = submissionRepository
                .findByCampaignIdAndStatus(campaignId, SubmissionStatus.ELIGIBLE);

        Map<Long, List<Submission>> byUser = eligible.stream()
                .collect(Collectors.groupingBy(s -> s.getUser().getId()));

        List<LeaderboardEntryDto> entries = new ArrayList<>();
        for (List<Submission> subs : byUser.values()) {
            String username = subs.get(0).getUser().getUsername();
            long totalViews = subs.stream().mapToLong(Submission::getViewCount).sum();
            BigDecimal totalEarned = BigDecimal.valueOf(totalViews)
                    .divide(BigDecimal.valueOf(1_000_000), 10, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(campaign.getRatePerMillion()))
                    .setScale(2, RoundingMode.HALF_UP);
            entries.add(new LeaderboardEntryDto(0, username, subs.size(), totalViews, totalEarned));
        }

        entries.sort(Comparator.comparing(LeaderboardEntryDto::getTotalEarned).reversed());
        List<LeaderboardEntryDto> ranked = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            LeaderboardEntryDto e = entries.get(i);
            ranked.add(new LeaderboardEntryDto(i + 1, e.getUsername(), e.getSubmissionCount(),
                    e.getTotalViews(), e.getTotalEarned()));
        }
        return ranked;
    }




}
